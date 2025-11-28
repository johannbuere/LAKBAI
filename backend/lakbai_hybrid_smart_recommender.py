"""
Lakbai Hybrid Smart Route Recommender
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

def get_themes_ids(pois):
    """Extract theme mappings from POI data (copied to avoid torch imports)"""
    theme2num = dict()
    num2theme = dict()
    poi2theme = dict()
    numpois = pois['poiID'].count()

    allthemes = sorted(pois['theme'].unique())
    for i in range(len(allthemes)):
        theme2num[allthemes[i]] = i
        num2theme[i] = allthemes[i]

    arr1 = pois['poiID'].array
    arr2 = pois['theme'].array

    for i in range(len(arr1)):
        pid = int(arr1[i])
        theme = arr2[i]
        poi2theme[pid] = theme
        if theme not in theme2num.keys():
            num = numpois + len(theme2num.keys())
            theme2num[theme] = num
            num2theme[num] = theme
    return theme2num, num2theme, poi2theme

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
            
            self.pois, self.user_visits, _, _ = load_dataset(self.city, DEBUG=0)
            
            # Use local get_themes_ids to avoid importing BTRec_RecTour23 (which imports torch)
            self.theme2num, self.num2theme, self.poi2theme = get_themes_ids(self.pois)
            
            print(f"✅ Loaded {len(self.pois)} POIs and user visit data")
            
            # BERT model loading disabled due to Python 3.13 incompatibility
            self.load_bert_model()
            
            # Build smart cache
            if not self.load_smart_cache():
                self.build_smart_cache()
            
            print("✅ Recommender initialized successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def load_bert_model(self):
        """Load your trained BERT model from output_Legazpi_e1_bert/"""
        try:
            from simpletransformers.classification import ClassificationModel
            
            model_path = os.path.join(os.path.dirname(__file__), "output_Legazpi_e1_bert")
            
            if not os.path.exists(model_path):
                print(f"⚠️  BERT model not found at {model_path}")
                self.bert_model = None
                return False
            
            print(f"🤖 Loading BERT model from {model_path}...")
            
            # Load the trained model (NOT from BTRec_RecTour23!)
            self.bert_model = ClassificationModel(
                'bert',
                model_path,
                use_cuda=False,  # Use CPU (works on any machine)
                args={'silent': True, 'use_multiprocessing': False}
            )
            
            print("✅ BERT model loaded successfully!")
            print("🎯 AI-powered recommendations are now active")
            return True
            
        except Exception as e:
            print(f"⚠️  BERT model loading failed: {e}")
            print("📊 Falling back to data-driven recommendations")
            print("💡 Make sure you're using Python 3.11 with PyTorch installed")
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
        """Get BERT predictions for a specific route using the trained model"""
        if not self.bert_model:
            return []
        
        try:
            # Format route as text input for BERT
            route_text = self._format_route_for_bert(route)
            
            if not route_text:
                return []
            
            # Get BERT prediction (returns predicted class/POI)
            predictions, raw_outputs = self.bert_model.predict([route_text])
            
            # predictions[0] is the predicted POI class (0-168 maps to POI IDs)
            predicted_class = int(predictions[0])
            
            # Get confidence score
            import numpy as np
            confidence = float(np.max(raw_outputs[0]))
            
            # Map class to POI ID (classes might correspond to POI IDs)
            # Try the class number as POI ID first
            poi_id = predicted_class
            
            # Make sure it's not already in route and exists
            if poi_id not in route:
                poi_info = self.get_poi_info(poi_id)
                if poi_info:
                    return [{
                        'poi_id': poi_id,
                        'name': poi_info['name'],
                        'theme': poi_info['theme'],
                        'score': confidence,
                        'reason': 'AI-powered BERT prediction based on your route'
                    }]
            
            # If first prediction doesn't work, try top 3
            top_3_indices = np.argsort(raw_outputs[0])[-3:][::-1]
            for idx in top_3_indices:
                poi_id = int(idx)
                if poi_id not in route:
                    poi_info = self.get_poi_info(poi_id)
                    if poi_info:
                        confidence = float(raw_outputs[0][idx])
                        return [{
                            'poi_id': poi_id,
                            'name': poi_info['name'],
                            'theme': poi_info['theme'],
                            'score': confidence,
                            'reason': 'AI-powered BERT prediction based on your route'
                        }]
            
            return []
            
        except Exception as e:
            print(f"⚠️  BERT prediction failed: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _format_route_for_bert(self, route):
        """Format route as text input for BERT model"""
        try:
            # Format matching training data structure
            # Typically: "user_id location poi_id theme poi_id theme ..."
            parts = []
            
            for poi_id in route:
                poi_info = self.get_poi_info(poi_id)
                if poi_info:
                    # Add POI ID and theme
                    parts.append(str(poi_id))
                    parts.append(poi_info['theme'])
            
            route_text = " ".join(parts)
            return route_text
            
        except Exception as e:
            print(f"⚠️  Route formatting failed: {e}")
            return ""
            
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
    
    def _get_popular_starting_pois(self, num_recommendations=10):
        """Get popular POIs as starting recommendations"""
        recommendations = []
        
        # Get most visited POIs from user visits data
        if hasattr(self, 'user_visits') and self.user_visits is not None and not self.user_visits.empty:
            try:
                poi_visit_counts = self.user_visits.groupby('poiID').size().reset_index(name='visit_count')
                poi_visit_counts = poi_visit_counts.sort_values('visit_count', ascending=False)
                
                max_visits = poi_visit_counts['visit_count'].max()
                if max_visits > 0:
                    for _, row in poi_visit_counts.head(num_recommendations * 2).iterrows():
                        poi_id = int(row['poiID'])  # Convert to int
                        poi_info = self.get_poi_info(poi_id)
                        if poi_info:
                            # Normalize score between 0-1
                            score = float(row['visit_count']) / float(max_visits)
                            recommendations.append({
                                'poi_id': poi_id,
                                'name': poi_info['name'],
                                'theme': poi_info['theme'],
                                'score': score,
                                'reason': f'Popular {poi_info["theme"]} attraction - {int(row["visit_count"])} visits!',
                                'sources': ['popular_start']
                            })
                        
                        if len(recommendations) >= num_recommendations:
                            break
            except Exception as e:
                print(f"⚠️  Error getting popular POIs from user visits: {e}")
        
        # Fallback: use POIs from starting_pois if available
        if len(recommendations) < num_recommendations and hasattr(self, 'popular_routes_from_data'):
            for theme, pois_data in self.popular_routes_from_data.get('starting_pois', {}).items():
                for poi_data in pois_data[:3]:
                    poi_id = poi_data['poi']
                    if not any(r['poi_id'] == poi_id for r in recommendations):
                        poi_info = self.get_poi_info(poi_id)
                        if poi_info:
                            recommendations.append({
                                'poi_id': poi_id,
                                'name': poi_info['name'],
                                'theme': poi_info['theme'],
                                'score': poi_data.get('score', 0.5),
                                'reason': f'Popular {theme} starting point',
                                'sources': ['popular_start']
                            })
                    
                    if len(recommendations) >= num_recommendations:
                        break
                if len(recommendations) >= num_recommendations:
                    break
        
        # Last resort: Just return first N POIs sorted by ID
        if len(recommendations) == 0:
            print("⚠️  No user visit data available, returning first POIs")
            for _, poi_row in self.pois.head(num_recommendations).iterrows():
                poi_id = int(poi_row['poiID'])
                recommendations.append({
                    'poi_id': poi_id,
                    'name': poi_row['poiName'],
                    'theme': poi_row['theme'],
                    'score': 0.5,
                    'reason': f'Discover this {poi_row["theme"]} attraction',
                    'sources': ['fallback']
                })
        
        # Sort by score and return top N
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        # Remove sources field before returning
        for rec in recommendations:
            if 'sources' in rec:
                del rec['sources']
        
        print(f"📍 Returning {len(recommendations[:num_recommendations])} popular starting POIs")
        return recommendations[:num_recommendations]
    
    def recommend_next_pois(self, current_route, num_recommendations=10):
        """Smart recommendations using both BERT and real data"""
        start_time = time.time()
        recommendations = []
        scored_recommendations = {}  # Use dict to track and merge scores
        
        if not current_route or len(current_route) == 0:
            print("📍 Empty route - returning popular starting POIs")
            return self._get_popular_starting_pois(num_recommendations)
        
        # Get last POI for context
        last_poi = current_route[-1]
        last_poi_info = self.get_poi_info(last_poi)
        current_theme = last_poi_info['theme'] if last_poi_info else None
        
        print(f"🎯 Generating recommendations after POI {last_poi} ({last_poi_info['name'] if last_poi_info else 'unknown'})")
        
        # Strategy 1: Real user transition data (HIGHEST priority)
        if last_poi in self.popular_routes_from_data['transitions']:
            print("📊 Using real user transition data")
            for transition in self.popular_routes_from_data['transitions'][last_poi][:8]:  # Increased from 5 to 8
                if transition['poi'] not in current_route:
                    poi_info = self.get_poi_info(transition['poi'])
                    if poi_info:
                        poi_id = transition['poi']
                        score = transition['score'] * 2.0  # INCREASED from 1.5 to 2.0 - highest boost
                        
                        if poi_id not in scored_recommendations:
                            scored_recommendations[poi_id] = {
                                'poi_id': poi_id,
                                'name': poi_info['name'],
                                'theme': poi_info['theme'],
                                'score': score,
                                'reason': f'Popular next stop - {transition["count"]} travelers chose this',
                                'sources': ['real_transitions']
                            }
                        else:
                            # Merge scores if POI recommended by multiple sources
                            scored_recommendations[poi_id]['score'] += score * 0.5
                            scored_recommendations[poi_id]['sources'].append('real_transitions')
        
        # Strategy 2: Theme continuity (same theme as current) - REDUCED PRIORITY
        # Only add theme-based recommendations as a minor boost to other sources
        if current_theme and current_theme in self.theme_groups:
            print(f"🎨 Adding minor theme continuity boost for {current_theme}")
            theme_pois = self.theme_groups[current_theme]
            for poi_id in theme_pois[:5]:  # Reduced from 10 to 5
                if poi_id not in current_route:
                    poi_info = self.get_poi_info(poi_id)
                    if poi_info:
                        # Calculate distance score (closer is better)
                        dist_key = (last_poi, poi_id)
                        distance = self.distance_matrix.get(dist_key, 999)
                        distance_score = 1.0 / (1.0 + distance * 10)  # Normalize distance
                        
                        score = 0.15 * distance_score  # FURTHER REDUCED from 0.3 to 0.15
                        
                        # Only boost existing recommendations, don't create new theme-only ones
                        if poi_id in scored_recommendations:
                            scored_recommendations[poi_id]['score'] += score * 0.1
                            if 'theme_match' not in scored_recommendations[poi_id]['sources']:
                                scored_recommendations[poi_id]['sources'].append('theme_match')
        
        # Strategy 3: BERT predictions (HIGH priority)
        route_key = tuple(current_route)
        if route_key in self.bert_predictions_cache:
            print("⚡ Using cached BERT predictions")
            bert_recs = self.bert_predictions_cache[route_key][:8]  # Increased from 5 to 8
            for rec in bert_recs:
                if rec['poi_id'] not in current_route:
                    poi_id = rec['poi_id']
                    score = rec['score'] * 1.8  # INCREASED from 1.2 to 1.8 - strong boost
                    
                    if poi_id not in scored_recommendations:
                        scored_recommendations[poi_id] = {
                            'poi_id': poi_id,
                            'name': rec['name'],
                            'theme': rec['theme'],
                            'score': score,
                            'reason': 'AI-powered prediction based on your route',
                            'sources': ['bert_cached']
                        }
                    else:
                        scored_recommendations[poi_id]['score'] += score * 0.4
                        scored_recommendations[poi_id]['sources'].append('bert_cached')
        
        # Strategy 4: Add nearby POIs from different themes for variety
        if len(scored_recommendations) < num_recommendations:
            print("🌟 Adding nearby POIs for more variety")
            # Get all POIs sorted by distance from last location
            nearby_pois = []
            for poi_id in range(1, len(self.pois) + 1):
                if poi_id not in current_route and poi_id not in scored_recommendations:
                    dist_key = (last_poi, poi_id)
                    distance = self.distance_matrix.get(dist_key, 999)
                    if distance < 0.5:  # Within reasonable distance
                        poi_info = self.get_poi_info(poi_id)
                        if poi_info:
                            nearby_pois.append({
                                'poi_id': poi_id,
                                'distance': distance,
                                'theme': poi_info['theme']
                            })
            
            # Sort by distance and add diverse themes
            nearby_pois.sort(key=lambda x: x['distance'])
            themes_added = set()
            for poi_data in nearby_pois:
                if len(scored_recommendations) >= num_recommendations:
                    break
                poi_id = poi_data['poi_id']
                poi_info = self.get_poi_info(poi_id)
                if poi_info:
                    # Prefer diverse themes
                    theme_bonus = 0.2 if poi_info['theme'] not in themes_added else 0
                    distance_score = 1.0 / (1.0 + poi_data['distance'] * 5)
                    score = distance_score * 0.5 + theme_bonus
                    
                    scored_recommendations[poi_id] = {
                        'poi_id': poi_id,
                        'name': poi_info['name'],
                        'theme': poi_info['theme'],
                        'score': score,
                        'reason': f'Nearby {poi_info["theme"]} attraction worth visiting',
                        'sources': ['nearby_diverse']
                    }
                    themes_added.add(poi_info['theme'])
        
        # Strategy 5: Real-time BERT if we still need more (expensive, use sparingly)
        if len(scored_recommendations) < num_recommendations and self.bert_model:
            print("🤖 Getting real-time BERT predictions...")
            try:
                bert_predictions = self.get_bert_predictions_for_route(current_route)
                for pred in bert_predictions[:3]:
                    poi_id = pred['poi_id']
                    if poi_id not in current_route:
                        if poi_id not in scored_recommendations:
                            scored_recommendations[poi_id] = {
                                'poi_id': poi_id,
                                'name': pred['name'],
                                'theme': pred['theme'],
                                'score': pred['score'] * 1.3,
                                'reason': 'Advanced AI recommendation for your route',
                                'sources': ['bert_realtime']
                            }
                        else:
                            scored_recommendations[poi_id]['score'] += pred['score'] * 0.5
                            scored_recommendations[poi_id]['sources'].append('bert_realtime')
            except Exception as e:
                print(f"⚠️  Real-time BERT failed: {e}")
        
        # Sort by combined score and return top recommendations
        recommendations = sorted(
            scored_recommendations.values(), 
            key=lambda x: x['score'], 
            reverse=True
        )[:num_recommendations]
        
        # Clean up reason text based on multiple sources
        for rec in recommendations:
            if len(rec['sources']) > 1:
                rec['reason'] = f"Highly recommended - {len(rec['sources'])} factors match your preferences"
            # Remove internal sources field
            del rec['sources']
        
        elapsed_time = time.time() - start_time
        print(f"⚡ Generated {len(recommendations)} recommendations in {elapsed_time*1000:.1f}ms")
        
        return recommendations
    
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