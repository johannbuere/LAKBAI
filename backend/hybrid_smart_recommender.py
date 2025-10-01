"""
Hybrid Smart Route Recommender
Combines BERT intelligence with fast pre-computed optimizations
"""

import os
import sys
import pandas as pd
import numpy as np
import json
import pickle
import time
from collections import defaultdict

# Set DATA_DIR for file path compatibility
DATA_DIR = os.environ.get("DATA_DIR", "Data")

class HybridSmartRecommender:
    def __init__(self, city="Legazpi", cache_file="smart_cache.pkl"):
        self.city = city
        self.cache_file = cache_file
        self.pois = None
        self.bert_model = None
        self.user_visits = None
        
        # Pre-computed data for speed
        self.theme_groups = {}
        self.distance_matrix = {}
        self.bert_predictions_cache = {}  # Cache BERT predictions
        self.popular_routes_from_data = {}  # From actual user data
        self.poi_embeddings = {}
        
        print(f"🧠 Hybrid Smart Recommender for {city}")
        print("=" * 60)
        
        if not self.initialize():
            print("❌ Initialization failed!")
            sys.exit(1)
    
    def initialize(self):
        """Initialize with both speed optimizations and BERT intelligence"""
        print("📊 Loading data and models...")
        
        try:
            # Load your actual data
            from poidata import load_dataset
            from BTRec_RecTour23 import get_themes_ids
            
            self.pois, self.user_visits, _, _ = load_dataset(self.city, DEBUG=0)
            self.theme2num, self.num2theme, self.poi2theme = get_themes_ids(self.pois)
            print(f"✅ Loaded {len(self.pois)} POIs and user visit data")
            
            # Try to load your trained BERT model
            self.load_bert_model()
            
            # Build smart cache
            if not self.load_smart_cache():
                self.build_smart_cache()
            
            return True
            
        except Exception as e:
            print(f"❌ Error initializing: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def load_bert_model(self):
        """Load your trained BERT model if available"""
        try:
            model_path = "output_Legazpi_e1_bert"
            if os.path.exists(model_path):
                from simpletransformers.classification import ClassificationModel
                import torch
                
                use_cuda = torch.cuda.is_available()
                self.bert_model = ClassificationModel(
                    model_type="bert",
                    model_name=model_path,
                    use_cuda=use_cuda
                )
                print("✅ BERT model loaded successfully")
                return True
            else:
                print("⚠️  BERT model not found - using fallback methods")
                return False
                
        except Exception as e:
            print(f"⚠️  BERT model load failed: {e}")
            self.bert_model = None
            return False
    
    def build_smart_cache(self):
        """Build cache using actual user data and BERT intelligence"""
        start_time = time.time()
        print("🔄 Building smart cache from actual data...")
        
        # 1. Analyze real user visit patterns
        self.analyze_real_user_patterns()
        
        # 2. Pre-compute BERT predictions for common scenarios
        self.precompute_bert_predictions()
        
        # 3. Build theme groups and distances
        self.compute_basic_structures()
        
        # 4. Save cache
        self.save_smart_cache()
        
        build_time = time.time() - start_time
        print(f"✅ Smart cache built in {build_time:.2f} seconds")
    
    def analyze_real_user_patterns(self):
        """Analyze actual user visit data to find real patterns"""
        print("🔍 Analyzing real user visit patterns...")
        
        self.popular_routes_from_data = {
            'starting_pois': defaultdict(list),
            'transitions': defaultdict(list),
            'popular_sequences': [],
            'theme_preferences': defaultdict(int)
        }
        
        # Group visits by user and sequence
        user_sequences = {}
        for _, visit in self.user_visits.iterrows():
            user_id = visit['userID']
            seq_id = visit['seqID']
            poi_id = visit['poiID']
            
            if user_id not in user_sequences:
                user_sequences[user_id] = {}
            if seq_id not in user_sequences[user_id]:
                user_sequences[user_id][seq_id] = []
            
            user_sequences[user_id][seq_id].append(poi_id)
        
        # Analyze patterns
        transition_counts = defaultdict(int)
        starting_poi_counts = defaultdict(int)
        sequence_patterns = []
        
        for user_id, sequences in user_sequences.items():
            for seq_id, pois in sequences.items():
                if len(pois) >= 2:
                    # Count starting POIs
                    starting_poi_counts[pois[0]] += 1
                    
                    # Count transitions
                    for i in range(len(pois) - 1):
                        transition_counts[(pois[i], pois[i+1])] += 1
                    
                    # Store sequence patterns
                    sequence_patterns.append(pois)
                    
                    # Count theme preferences
                    for poi in pois:
                        if poi in self.poi2theme:
                            theme = self.poi2theme[poi]
                            self.popular_routes_from_data['theme_preferences'][theme] += 1
        
        # Convert to recommendations with scores
        # Top starting POIs
        sorted_starting = sorted(starting_poi_counts.items(), key=lambda x: x[1], reverse=True)
        for poi, count in sorted_starting[:20]:  # Top 20 starting POIs
            if poi in self.poi2theme:
                theme = self.poi2theme[poi]
                self.popular_routes_from_data['starting_pois'][theme].append({
                    'poi': poi,
                    'score': count / len(user_sequences),  # Normalized score
                    'count': count
                })
        
        # Top transitions
        sorted_transitions = sorted(transition_counts.items(), key=lambda x: x[1], reverse=True)
        for (from_poi, to_poi), count in sorted_transitions[:100]:  # Top 100 transitions
            self.popular_routes_from_data['transitions'][from_poi].append({
                'poi': to_poi,
                'score': count / sum(transition_counts.values()),
                'count': count,
                'theme': self.poi2theme.get(to_poi, 'Unknown')
            })
        
        # Popular complete sequences
        sequence_counts = defaultdict(int)
        for seq in sequence_patterns:
            if len(seq) <= 6:  # Reasonable length sequences
                seq_key = tuple(seq)
                sequence_counts[seq_key] += 1
        
        sorted_sequences = sorted(sequence_counts.items(), key=lambda x: x[1], reverse=True)
        for seq, count in sorted_sequences[:50]:  # Top 50 sequences
            self.popular_routes_from_data['popular_sequences'].append({
                'sequence': list(seq),
                'score': count / len(sequence_patterns),
                'count': count
            })
        
        print(f"✅ Found {len(sorted_starting)} starting patterns, {len(sorted_transitions)} transitions")
    
    def precompute_bert_predictions(self):
        """Pre-compute BERT predictions for common route scenarios"""
        if not self.bert_model:
            print("⚠️  Skipping BERT pre-computation (model not available)")
            return
        
        print("🤖 Pre-computing BERT predictions for common scenarios...")
        
        self.bert_predictions_cache = {}
        
        # Get top starting POIs for pre-computation
        popular_starting_pois = []
        for theme, pois in self.popular_routes_from_data['starting_pois'].items():
            for poi_data in pois[:3]:  # Top 3 per theme
                popular_starting_pois.append(poi_data['poi'])
        
        # Pre-compute predictions for 1-3 POI routes
        routes_to_precompute = []
        
        # Single POI routes
        for poi in popular_starting_pois[:10]:  # Top 10 starting POIs
            routes_to_precompute.append([poi])
        
        # Two POI routes (using real transitions)
        for from_poi in popular_starting_pois[:5]:
            if from_poi in self.popular_routes_from_data['transitions']:
                for transition in self.popular_routes_from_data['transitions'][from_poi][:3]:
                    routes_to_precompute.append([from_poi, transition['poi']])
        
        # Pre-compute BERT predictions
        for route in routes_to_precompute:
            try:
                predictions = self.get_bert_predictions_for_route(route)
                route_key = tuple(route)
                self.bert_predictions_cache[route_key] = predictions
                print(f"✅ Cached BERT predictions for route {route}")
                
                # Limit to prevent too much computation
                if len(self.bert_predictions_cache) >= 50:
                    break
                    
            except Exception as e:
                print(f"⚠️  Failed to cache predictions for {route}: {e}")
                continue
        
        print(f"✅ Pre-computed {len(self.bert_predictions_cache)} BERT prediction sets")
    
    def get_bert_predictions_for_route(self, route):
        """Get BERT predictions for a specific route"""
        if not self.bert_model:
            return []
        
        try:
            from BTRec_RecTour23 import predict_user_insert, getUserLocation
            from config import setting
            
            # Ensure user location data is available
            if "User2City" not in setting:
                user2city = getUserLocation()
                setting["User2City"] = user2city
            
            # Create context for BERT prediction
            context_arr = []
            user_id = "test_user_123"
            user_location = "Philippines"
            
            for poi_id in route:
                context_arr.extend([
                    user_id,
                    user_location,
                    str(poi_id),
                    self.poi2theme[poi_id]
                ])
            
            # Try to get BERT prediction
            predictions = []
            try:
                pval, predicted_arr = predict_user_insert(
                    context_arr, 
                    self.bert_model, 
                    self.pois, 
                    len(route)
                )
                
                if predicted_arr and pval and pval > -999:
                    # Extract predicted POI
                    predicted_pois = predicted_arr[2::4]
                    for poi_str in predicted_pois:
                        poi_id = int(poi_str)
                        if poi_id not in route:
                            poi_info = self.get_poi_info(poi_id)
                            if poi_info:
                                predictions.append({
                                    'poi_id': poi_id,
                                    'score': float(pval),
                                    'name': poi_info['name'],
                                    'theme': poi_info['theme'],
                                    'source': 'BERT'
                                })
                            break
                
            except Exception as e:
                print(f"⚠️  BERT prediction failed for {route}: {e}")
            
            return predictions
            
        except Exception as e:
            print(f"❌ Error in BERT prediction: {e}")
            return []
    
    def compute_basic_structures(self):
        """Compute basic structures for speed"""
        # Theme groups
        self.theme_groups = {}
        for theme in self.pois['theme'].unique():
            theme_pois = self.pois[self.pois['theme'] == theme]['poiID'].tolist()
            self.theme_groups[theme] = theme_pois
        
        # Distance matrix (simplified)
        self.distance_matrix = {}
        for _, poi1 in self.pois.iterrows():
            for _, poi2 in self.pois.iterrows():
                if poi1['poiID'] != poi2['poiID']:
                    dist = abs(poi1['lat'] - poi2['lat']) + abs(poi1['long'] - poi2['long'])
                    self.distance_matrix[(poi1['poiID'], poi2['poiID'])] = dist
        
        print("✅ Computed basic structures")
    
    def load_smart_cache(self):
        """Load smart cache if available"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'rb') as f:
                    cache_data = pickle.load(f)
                
                self.popular_routes_from_data = cache_data['popular_routes_from_data']
                self.bert_predictions_cache = cache_data['bert_predictions_cache']
                self.theme_groups = cache_data['theme_groups']
                self.distance_matrix = cache_data['distance_matrix']
                
                print(f"✅ Smart cache loaded: {len(self.bert_predictions_cache)} BERT predictions cached")
                return True
        except Exception as e:
            print(f"⚠️  Smart cache load failed: {e}")
        return False
    
    def save_smart_cache(self):
        """Save smart cache"""
        try:
            cache_data = {
                'popular_routes_from_data': self.popular_routes_from_data,
                'bert_predictions_cache': self.bert_predictions_cache,
                'theme_groups': self.theme_groups,
                'distance_matrix': self.distance_matrix
            }
            
            with open(self.cache_file, 'wb') as f:
                pickle.dump(cache_data, f)
            print(f"✅ Smart cache saved")
            
        except Exception as e:
            print(f"❌ Smart cache save failed: {e}")
    
    def get_poi_info(self, poi_id):
        """Get POI information"""
        poi_row = self.pois[self.pois['poiID'] == poi_id]
        if poi_row.empty:
            return None
        
        poi = poi_row.iloc[0]
        return {
            'id': poi['poiID'],
            'name': poi['poiName'],
            'theme': poi['theme'],
            'lat': poi['lat'],
            'long': poi['long']
        }
    
    def recommend_next_pois(self, current_route, num_recommendations=3):
        """Smart recommendations using both BERT and real data"""
        start_time = time.time()
        recommendations = []
        
        if not current_route:
            # Use real data for starting recommendations
            print("🎯 Using real user data for starting recommendations")
            
            for theme, pois_data in self.popular_routes_from_data['starting_pois'].items():
                for poi_data in pois_data[:2]:  # Top 2 per theme
                    poi_info = self.get_poi_info(poi_data['poi'])
                    if poi_info:
                        recommendations.append({
                            'poi_id': poi_data['poi'],
                            'name': poi_info['name'],
                            'theme': poi_info['theme'],
                            'score': poi_data['score'],
                            'reason': f'Popular starting point (used by {poi_data["count"]} users)'
                        })
        else:
            # Try cached BERT predictions first
            route_key = tuple(current_route)
            if route_key in self.bert_predictions_cache:
                print("⚡ Using cached BERT predictions")
                bert_recs = self.bert_predictions_cache[route_key]
                for rec in bert_recs:
                    if rec['poi_id'] not in current_route:
                        recommendations.append({
                            'poi_id': rec['poi_id'],
                            'name': rec['name'],
                            'theme': rec['theme'],
                            'score': rec['score'],
                            'reason': 'BERT AI prediction (cached)'
                        })
            
            # Use real transition data
            last_poi = current_route[-1]
            if last_poi in self.popular_routes_from_data['transitions']:
                print("📊 Using real user transition data")
                for transition in self.popular_routes_from_data['transitions'][last_poi]:
                    if transition['poi'] not in current_route:
                        poi_info = self.get_poi_info(transition['poi'])
                        if poi_info:
                            recommendations.append({
                                'poi_id': transition['poi'],
                                'name': poi_info['name'],
                                'theme': poi_info['theme'],
                                'score': transition['score'],
                                'reason': f'Popular transition ({transition["count"]} users took this path)'
                            })
            
            # If we have few recommendations, try real-time BERT (slower but smarter)
            if len(recommendations) < num_recommendations and self.bert_model:
                print("🤖 Getting real-time BERT predictions...")
                try:
                    bert_predictions = self.get_bert_predictions_for_route(current_route)
                    for pred in bert_predictions:
                        if pred['poi_id'] not in current_route:
                            recommendations.append({
                                'poi_id': pred['poi_id'],
                                'name': pred['name'],
                                'theme': pred['theme'],
                                'score': pred['score'],
                                'reason': 'BERT AI prediction (real-time)'
                            })
                except Exception as e:
                    print(f"⚠️  Real-time BERT failed: {e}")
        
        # Remove duplicates and sort by score
        seen_pois = set()
        unique_recommendations = []
        
        for rec in sorted(recommendations, key=lambda x: x['score'], reverse=True):
            if rec['poi_id'] not in seen_pois:
                unique_recommendations.append(rec)
                seen_pois.add(rec['poi_id'])
                
                if len(unique_recommendations) >= num_recommendations:
                    break
        
        elapsed_time = time.time() - start_time
        print(f"⚡ Smart recommendations generated in {elapsed_time*1000:.1f}ms")
        
        return unique_recommendations[:num_recommendations]
    
    def get_recommendation_stats(self):
        """Get statistics about the recommendation system"""
        stats = {
            'total_pois': len(self.pois),
            'cached_bert_predictions': len(self.bert_predictions_cache),
            'real_user_sequences': len(self.popular_routes_from_data['popular_sequences']),
            'starting_poi_patterns': sum(len(pois) for pois in self.popular_routes_from_data['starting_pois'].values()),
            'transition_patterns': sum(len(transitions) for transitions in self.popular_routes_from_data['transitions'].values()),
            'bert_model_available': self.bert_model is not None
        }
        return stats

def main():
    """Test the hybrid smart recommender"""
    recommender = HybridSmartRecommender()
    
    print("\n📊 System Statistics:")
    stats = recommender.get_recommendation_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    print("\n🧪 Testing Recommendations:")
    
    # Test different scenarios
    test_scenarios = [
        {"name": "Empty Route (Starting)", "route": []},
        {"name": "Single POI", "route": [1]},
        {"name": "Two POIs", "route": [1, 5]},
        {"name": "Three POIs", "route": [1, 5, 10]}
    ]
    
    for scenario in test_scenarios:
        print(f"\n🔸 {scenario['name']}: {scenario['route']}")
        
        start_time = time.time()
        recommendations = recommender.recommend_next_pois(scenario['route'])
        elapsed_time = (time.time() - start_time) * 1000
        
        print(f"   ⚡ Generated in {elapsed_time:.1f}ms")
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. {rec['name']} ({rec['theme']}) - Score: {rec['score']:.3f}")
            print(f"      Reason: {rec['reason']}")

if __name__ == "__main__":
    main()