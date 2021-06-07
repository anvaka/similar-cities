# Similar cities

This website shows cities that have similar road networks. 

![grid similarities](https://i.imgur.com/BUZJ1Bl.png)

Play with it here: https://anvaka.github.io/similar-cities/

## Definition of the similarity

The similarity of two graphs is defined by counting number of anonymous walks on each graph
and then computing generalized Jaccard similarity of the count vectors.

Let me interpret the statement above.

Imagine there is a slightly drunk person walking in a city. They start at random position
in the first city, take a very short walk, say 4 intersections, and stop. At each intersection
they pick a random direction.

They don't remember the names of the intersections, or any previous walks that they've done.
However during a single walk, they remember each intersection by assigning it a number.

It could go like this:

```
Intersection 1: Decided to go to intersection 2
Intersection 2: Decided to go to intersection 3
Intersection 3: Decided to go back to intersection 2
Intersection 2: Stop
```

The entire walk can be labeled by sequence of intersection numbers: `1,2,3,2`. 

Now, we remember that sequence `1,2,3,2` happened one time. Let's repeat the walking process
a few thousand times, starting at arbitrary node. 

Every time we get a sequence - we add plus one to the number of times we've seen this 
sequence before.

Then we repeat the same process for the second city! At the end we get two counters of sequences,
one for each city.

We assume that the more times same sequence appears in both cities - the more similar are those cities.

This doesn't take into account road lengths or directions. Just a general local structure of the walk.

In practice, I took not 4 intersections, but 8. This gives approximately 4,000 possible unique sequences,
and I use them to compare similarity of the graphs.

# Data and code

The entire algorithm that finds graph similarity is [available here](https://github.com/anvaka/similar-cities-data/blob/main/graph-embedding/random-walk.js)

The cities are indexed from [OpenStreetMap](https://www.openstreetmap.org/) using code in [anvaka/similar-cities-data](https://github.com/anvaka/similar-cities-data)
repository. There are ~2,500 cities captured by the crawler. As is results are pretty interesting, but extending the
dataset would probably yield even better results. If you know how to reliably get all roads within city boundaries form
OpenStreetMap, please share. 

## Local build

First - you need to clone/fork this repository and then:

```
npm install
```

### Compiles and hot-reloads for development
```
npm start
```

## Thanks!

* Stay tuned for updates: https://twitter.com/anvaka
* If you like my work and would like to support it - https://www.patreon.com/anvaka