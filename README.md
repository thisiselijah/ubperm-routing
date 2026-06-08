# ubperm-routing
<!-- 
<img src="./assets/reco-cover.png"/> -->

![Static Badge](https://img.shields.io/badge/C%2B%2B-grey?style=plastic&logo=C%2B%2B)
![Static Badge](https://img.shields.io/badge/Three.js-grey?style=plastic&logo=Three.js)
![Static Badge](https://img.shields.io/badge/WebAssembly-grey?style=plastic&logo=WebAssembly)

The project is about the permutation routing with deflection on an unbuffered hypercubes.

## Algorithms
The project explores multiple algorithms for finding routing paths on the hypercube network:
1. **Breadth-First Search (BFS):** Explores the state space level by level to find the absolute shortest path. However, it scales poorly due to the massive state space of permutation routing. 
   * **Time Complexity:** $O(b^D) \approx O(N!)$ worst-case, where $b$ is the branching factor (hypercube edges) and $D$ is the optimal path depth.
2. **Bitonic Merge Sort:** Uses deterministic bitonic sorting networks mapped onto the hypercube topology. It is highly scalable but produces sub-optimal path lengths.
   * **Time Complexity:** $O(N \log^2 N)$ deterministic time. Requires zero state exploration.
3. **A\* Search:** An informed search algorithm that uses a standard distance heuristic to significantly narrow down the search space compared to BFS, finding optimal or near-optimal paths faster.
   * **Time Complexity:** $O(b^D)$ worst-case, but practically expands exponentially fewer nodes than BFS due to the heuristic guidance.
4. **Entropy-Cycle Search:** A highly optimized engine that combines both group theory (Cycle Decomposition) and Information Theory (Shannon Entropy). It strictly scores states using cycle length bounds while using displacement entropy as a tie-breaking penalty to resolve packets methodically.
   * **Time Complexity:** $O(b^D)$ theoretically, but the heavily informed heuristic prunes the search tree so aggressively that it achieves near-polynomial empirical runtimes on small/medium hypercubes. Each heuristic evaluation takes $O(N)$ time.
### How the A* Search Works

The **A\* Search** algorithm is an informed search strategy that significantly improves upon Breadth-First Search (BFS) by using a *heuristic* to guide its exploration of the hypercube.

#### 1. The Cost Function $f(n) = g(n) + h(n)$
Instead of blindly expanding in all directions like BFS, A* maintains a priority queue of states ranked by $f(n)$.
- $g(n)$ is the **actual cost** (the number of physical hypercube edge-swaps taken so far to reach the current state).
- $h(n)$ is the **heuristic estimate** (the guessed number of swaps still needed to reach the sorted target state).

By continually exploring the state with the lowest $f(n)$, the algorithm guarantees finding the absolute shortest path while avoiding useless detours.

#### 2. The Heuristic: Hamming Distance
In our hypercube implementation, the heuristic $h(n)$ is built around the **Hamming Distance**. 
For every packet in the network, we look at its current node address and its target node address. We use a bitwise XOR and count the set bits (`popcount(current ^ target)`) to determine exactly how many hypercube dimensions the packet still needs to traverse. 

Because every physical swap along a hypercube edge moves *two* packets simultaneously (potentially correcting one dimension for each packet), we sum the Hamming distance across all packets and divide by 2. This creates an "admissible" heuristic (it never overestimates the true cost), allowing A* to safely and optimally prune millions of unpromising branches that BFS would otherwise compute.

### How the Entropy-Cycle Search Works

The **Entropy-Cycle Search** is the crown jewel of this routing visualizer. It solves the unbuffered permutation routing problem by synergizing two entirely different fields of mathematics: **Permutation Group Theory** and **Information Theory**.

#### 1. The Group-Theoretic Baseline (Cycle Decomposition)
Instead of looking at the hypercube purely as a network graph, the algorithm views the current state of packets as a mathematical *permutation*. Every permutation can be uniquely broken down into a set of "disjoint cycles." (For example, Node A holds Node B's packet, Node B holds Node C's packet, and Node C holds Node A's packet $\rightarrow$ a cycle of 3).

The absolute optimal state is exactly $N$ cycles, where each cycle has a length of 1 (every packet is exactly where it belongs). 
Mathematically, every time we perform a swap between two packets in the *same* cycle, the cycle fractures into two. Every time we swap packets in *different* cycles, they merge. Therefore, to reach a fully sorted state of $N$ cycles from a starting state of $C$ cycles, the absolute minimum number of mathematical transpositions required is exactly **$N - C$**. 

The algorithm uses $N - C$ (combined with the hypercube's topological distance) to fiercely guide the search, strongly preferring physical hypercube edge-swaps that fracture large permutation cycles.

#### 2. The Information-Theoretic Tie-Breaker (Shannon Entropy)
While $N - C$ provides an incredibly powerful baseline, the algorithm still faces choices when multiple edge-swaps reduce the cycle count equally.

To solve this, it uses **Shannon Entropy**. It calculates the displacement errors of every packet (which bit dimensions are still incorrect) and computes the entropy of the network. A high entropy state means errors are chaotically scattered across dimensions; a low entropy state means errors are methodically isolated to specific dimensions.

By adding a fractional entropy penalty (`+ 0.1 * entropy`), the algorithm elegantly breaks ties. It forces the search to resolve the hypercube systematically (dimension by dimension), actively punishing chaotic swaps.

**The Synergy:** Cycle decomposition does the heavy lifting of mathematically unknotting the permutations, while Shannon entropy acts as a subtle organizer, ensuring packets flow harmoniously across the hypercube network without random scattering!

## Usage

### 1. Core C++ Executable
The core routing algorithms are implemented in C++. Compile the executable first, then run it directly for a single permutation test.
```bash
# Compile
g++ -O3 src/main.cpp -o src/bin/routing

# Run
./src/bin/routing -algo <bfs|merge|astar|entropy_cycle> <-default|-test> <comma_separated_numbers>

# Example
./src/bin/routing -algo merge -default 7,6,5,4,3,2,1,0
```

### 2. Batch Testing Script (`test.py`)
A Python script is provided to run batch tests using multithreading. It evaluates the executable and saves the number of steps into the `data/` directory.
```bash
# Run exhaustive permutations for N=8 (3-cube) using A*
python scripts/test.py -cube 3 -algo astar -auto

# Run permutations from a text file for N=16 (4-cube) using Merge Sort
python scripts/test.py -cube 4 -algo merge -text input_file.txt
```
**Arguments:**
- `-cube <int>`: Hypercube dimension (e.g., `3` for 8 nodes, `4` for 16 nodes).
- `-exe <path>`: Path to the C++ executable (default: `src/bin/routing`).
- `-algo <string>`: Algorithm to use (`bfs`, `merge`, `astar`, `entropy_cycle`).
- `-auto`: Exhaustively evaluate all permutations (only recommended for N=8).
- `-text <filename>`: Read test cases from a text file (one comma-separated array per line).

### 3. Plotting Script (`plot.py`)
Generates comparison charts and statistical summaries based on the results generated by `test.py`.
```bash
# Display the interactive plot
python scripts/plot.py

# Save the plot directly to the /assets/ directory
python scripts/plot.py -save
```

### 4. WebAssembly Module Compilation
The visualization frontend relies on a WebAssembly module (`router.wasm`) to compute paths quickly in the browser. You can recompile `src/wasm.cpp` into WebAssembly using Emscripten. Ensure your environment has Emscripten initialized (e.g. `source ~/emsdk/emsdk_env.sh`).

```bash
# Compile the WASM bindings directly into the Next.js public directory
emcc -O3 --bind src/wasm.cpp -o website/public/router.js \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=createRouterModule \
  -s ALLOW_MEMORY_GROWTH=1
```
*Note: The `-s ALLOW_MEMORY_GROWTH=1` flag is vital to prevent Out-Of-Memory (OOM) aborts in the browser when expanding millions of search states for larger dimensions.*

## Component
This project includes a core algorithm module compiled to WebAssembly, and a fully static Next.js visualization module. We also write a script to evaluate the algorithm against a baseline algorithm, which is BFS.

- [x] algorithm module
  - [x] BFS
  - [x] Merge Sort
  - [x] A* Search
  - [x] Entropy-Cycle Search
- [x] script to evaluate the algorithm
  - [x] batch test
  - [x] single test 
  - [x] chart of experiment (export statistical distributions)
- [x] visualization module
  - [x] WebAssembly frontend integration
  - [x] the cube
    - [x] animation on the packet number when packet's pos is changed
    - [x] animation on the edge when packet's pos is changed
  - [x] the panel
    - [x] randomly permutaion
    - [x] permutate the given sequence
    - [x] steps

## Result
*(Experiment charts are generated in the `/assets/` directory using `plot.py`)*
