# BTRec: BERT-based Trajectory Recommendation for Personalized Tours Personalized Tours

## [RecTour 2023 : workshop on recommenders in tourism](https://workshops.ds-ifs.tuwien.ac.at/rectour23/)

### Ngai Lam Ho, Roy Ka-Wei Lee and Kwan Hui Lim 

### [Information Systems Technology and Design](https://istd.sutd.edu.sg/) (ISTD) 

### [Singapore University of Technology and Design](https://www.sutd.edu.sg/), 8 Somapah Rd Singapore 487 

### Abstract

When visiting unfamiliar cities, it is crucial for tourists to have a well-planned itinerary and relevant
recommendations. However, many tour recommendation algorithms only take into account a limited
number of factors, such as popular Points of Interest(Pois) and routing constraints. Consequently, the
solutions they provide may not always align with individual user of the system. In this paper, we propose
2 iterative algorithms: PPoiBert and BtRec, that extend from the PoiBert algorithm to recommend
personalized itineraries on Pois using the Bert framework. Firstly, we propose PPoiBert as a basic
framework for recommending personalized itineraries, depending on different user inputs; secondly,
our BtRec algorithm additionally incorporates users’ demographic information into the Bert language
model to recommend a personalized Poi itinerary prediction given {𝑝<sub>u</sub>, 𝑝<sub>v</sub>}. Our recommendation system
can create a travel itinerary that maximizes Pois visited, while also taking into account user preferences for
categories of Pois and time availability. This is achieved by analyzing the travel histories of similar users.
Our recommendation algorithms are motivated by the sentence completion problem in natural language
processing (Nlp). We enhance the itinerary prediction using our proposed algorithm, BtRec (Bert-based
Trajectory Recommendation,) that makes recommendations using trajectories with their demographic
information such as cities and countries in the recommendation algorithm. The prediction algorithm in
BtRec identifies a suitable profile that most similar to the query specification, before generating a list
of Pois for recommendation. Using a Flickr data set of nine cities of different sizes, our experimental
results demonstrate that our proposed algorithms are stable and outperform many other sequence
prediction algorithms, measured by recall, precision, and ℱ1-scores.

[Data & source code](https://github.com/nxh912/BTRec_RecSys23/ "https://github.com/nxh912/BTRec_RecSys23/")

[Archive](https://arxiv.org/abs/2310.19886 "https://arxiv.org/abs/2310.19886")


![](./)
<img src="./googletag.svg">
