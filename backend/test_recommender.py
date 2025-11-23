"""
Quick test script to see if the recommender works
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("Testing Recommender Initialization")
print("=" * 60)

try:
    from lakbai_hybrid_smart_recommender import HybridSmartRecommender
    print("✅ Import successful")
    
    print("\n🔄 Creating recommender instance...")
    recommender = HybridSmartRecommender(city="Legazpi")
    print("✅ Recommender created!")
    
    print("\n🧪 Testing empty route (should return popular POIs)...")
    recs = recommender.recommend_next_pois([], 5)
    print(f"✅ Got {len(recs)} recommendations")
    
    for i, rec in enumerate(recs, 1):
        print(f"  {i}. {rec['name']} ({rec['theme']}) - Score: {rec['score']:.3f}")
        print(f"     Reason: {rec['reason']}")
    
    print("\n🧪 Testing route with POI 1...")
    recs = recommender.recommend_next_pois([1], 5)
    print(f"✅ Got {len(recs)} recommendations")
    
    for i, rec in enumerate(recs, 1):
        print(f"  {i}. {rec['name']} ({rec['theme']}) - Score: {rec['score']:.3f}")
        print(f"     Reason: {rec['reason']}")
    
    print("\n✅ All tests passed!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
