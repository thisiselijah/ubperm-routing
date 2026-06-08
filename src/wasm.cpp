#include <emscripten/bind.h>
#include <vector>
#include <queue>
#include <unordered_map>
#include <cmath>
#include <algorithm>
#include <cstdint>

using namespace emscripten;

class HypercubeRouter {
private:
    int n;
    int bit_levels;
    uint64_t start_state;
    uint64_t target_state;

    uint64_t pack_state(const std::vector<int>& perm) const {
        uint64_t state = 0;
        for (size_t i = 0; i < perm.size(); ++i) {
            state |= (static_cast<uint64_t>(perm[i]) << (i * 4));
        }
        return state;
    }

    uint64_t get_target_state(int size) const {
        uint64_t state = 0;
        for (int i = 0; i < size; ++i) {
            state |= (static_cast<uint64_t>(i) << (i * 4));
        }
        return state;
    }

    struct AStarState {
        uint64_t state;
        int g;
        int f;
        bool operator>(const AStarState& other) const {
            return f > other.f;
        }
    };

    int popcount(int x) const {
        int count = 0;
        while (x) {
            count += (x & 1);
            x >>= 1;
        }
        return count;
    }

    int computeHeuristic(uint64_t state) const {
        int total_dist = 0;
        for (int i = 0; i < n; ++i) {
            int val = (state >> (i * 4)) & 15ULL;
            total_dist += popcount(i ^ val);
        }
        return (total_dist + 1) / 2;
    }

public:
    HypercubeRouter(const std::vector<int>& perm) {
        n = perm.size();
        bit_levels = (n == 8) ? 3 : 4;
        start_state = pack_state(perm);
        target_state = get_target_state(n);
    }

    bool isValidSize() const {
        return (n == 8 || n == 16);
    }

    std::vector<int> solveWithBFS() {
        std::vector<int> flat_swaps;
        if (start_state == target_state) return flat_swaps;

        std::queue<uint64_t> q;
        std::unordered_map<uint64_t, std::pair<uint64_t, std::pair<int, int>>> parent;

        q.push(start_state);
        parent[start_state] = {start_state, {-1, -1}};

        bool found = false;

        while (!q.empty()) {
            uint64_t curr = q.front();
            q.pop();

            if (curr == target_state) {
                found = true;
                break;
            }

            for (int i = 0; i < n; ++i) {
                for (int b = 0; b < bit_levels; ++b) {
                    int j = i ^ (1 << b);
                    if (i < j) {
                        uint64_t val_i = (curr >> (i * 4)) & 15ULL;
                        uint64_t val_j = (curr >> (j * 4)) & 15ULL;

                        uint64_t next_state = curr;
                        next_state &= ~((15ULL << (i * 4)) | (15ULL << (j * 4)));
                        next_state |= (val_i << (j * 4)) | (val_j << (i * 4));

                        if (parent.find(next_state) == parent.end()) {
                            parent[next_state] = {curr, {i, j}};
                            q.push(next_state);
                        }
                    }
                }
            }
        }

        if (found) {
            std::vector<std::pair<int, int>> swap_order;
            uint64_t curr = target_state;
            while (curr != start_state) {
                auto p = parent[curr];
                swap_order.push_back(p.second);
                curr = p.first;
            }
            std::reverse(swap_order.begin(), swap_order.end());
            for (auto& p : swap_order) {
                flat_swaps.push_back(p.first);
                flat_swaps.push_back(p.second);
            }
        }
        return flat_swaps;
    }

    std::vector<int> solveWithAStar() {
        std::vector<int> flat_swaps;
        if (start_state == target_state) return flat_swaps;

        std::priority_queue<AStarState, std::vector<AStarState>, std::greater<AStarState>> pq;
        std::unordered_map<uint64_t, int> g_score;
        std::unordered_map<uint64_t, std::pair<uint64_t, std::pair<int, int>>> parent;

        int h_start = computeHeuristic(start_state);
        pq.push({start_state, 0, h_start});
        g_score[start_state] = 0;
        parent[start_state] = {start_state, {-1, -1}};

        bool found = false;

        while (!pq.empty()) {
            AStarState curr = pq.top();
            pq.pop();

            uint64_t curr_state = curr.state;

            if (curr_state == target_state) {
                found = true;
                break;
            }

            if (curr.g > g_score[curr_state]) continue;

            for (int i = 0; i < n; ++i) {
                for (int b = 0; b < bit_levels; ++b) {
                    int j = i ^ (1 << b);
                    if (i < j) {
                        uint64_t val_i = (curr_state >> (i * 4)) & 15ULL;
                        uint64_t val_j = (curr_state >> (j * 4)) & 15ULL;

                        uint64_t next_state = curr_state;
                        next_state &= ~((15ULL << (i * 4)) | (15ULL << (j * 4)));
                        next_state |= (val_i << (j * 4)) | (val_j << (i * 4));

                        int tentative_g = curr.g + 1;
                        if (g_score.find(next_state) == g_score.end() || tentative_g < g_score[next_state]) {
                            g_score[next_state] = tentative_g;
                            parent[next_state] = {curr_state, {i, j}};
                            int h = computeHeuristic(next_state);
                            pq.push({next_state, tentative_g, tentative_g + h});
                        }
                    }
                }
            }
        }

        if (found) {
            std::vector<std::pair<int, int>> swap_order;
            uint64_t curr = target_state;
            while (curr != start_state) {
                auto p = parent[curr];
                swap_order.push_back(p.second);
                curr = p.first;
            }
            std::reverse(swap_order.begin(), swap_order.end());
            for (auto& p : swap_order) {
                flat_swaps.push_back(p.first);
                flat_swaps.push_back(p.second);
            }
        } else {
            flat_swaps.push_back(-1);
        }
        return flat_swaps;
    }

    std::vector<int> solveWithBitonicSort(std::vector<int> current_perm) {
        std::vector<int> flat_swaps;
        int num_nodes = current_perm.size(); 

        for (int k = 2; k <= num_nodes; k *= 2) {
            for (int j = k / 2; j > 0; j /= 2) {
                for (int i = 0; i < num_nodes; i++) {
                    int neighbor = i ^ j; 
                    if (i < neighbor) {
                        bool ascending_order = ((i & k) == 0);
                        if ((current_perm[i] > current_perm[neighbor]) == ascending_order) {
                            std::swap(current_perm[i], current_perm[neighbor]);
                            flat_swaps.push_back(i);
                            flat_swaps.push_back(neighbor);
                        }
                    }
                }
            }
        }
        return flat_swaps;
    }

    // Removed calculateCycleHeuristic

    double calculateEntropyCycleHeuristic(uint64_t state) const {
        std::vector<int> perm(n);
        for (int i = 0; i < n; ++i) {
            perm[i] = (state >> (i * 4)) & 15ULL;
        }

        int cycles = 0;
        std::vector<bool> visited(n, false);
        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                cycles++;
                int curr = i;
                while (!visited[curr]) {
                    visited[curr] = true;
                    curr = perm[curr];
                }
            }
        }
        int group_swaps = n - cycles;

        double total_distance = 0;
        std::unordered_map<int, int> error_counts;
        for (int i = 0; i < n; ++i) {
            int error = i ^ perm[i]; 
            if (error != 0) {
                error_counts[error]++;
            }
            int dist = 0;
            int temp = error;
            while (temp > 0) {
                dist += (temp & 1);
                temp >>= 1;
            }
            total_distance += dist;
        }

        double entropy = 0.0;
        for (auto const& pair : error_counts) {
            double p = static_cast<double>(pair.second) / n;
            if (p > 0) {
                entropy -= p * std::log2(p);
            }
        }

        double base_heuristic = std::max((double)group_swaps, total_distance / 2.0);
        return base_heuristic + 0.1 * entropy;
    }

    // Removed solveWithCycleDecomp

    std::vector<int> solveWithEntropyCycle(std::vector<int> current_perm) {
        std::vector<int> flat_swaps;
        uint64_t start = pack_state(current_perm);
        if (start == target_state) return flat_swaps;

        std::priority_queue<std::pair<double, uint64_t>, std::vector<std::pair<double, uint64_t>>, std::greater<std::pair<double, uint64_t>>> pq;
        std::unordered_map<uint64_t, std::pair<uint64_t, std::pair<int, int>>> parent;
        std::unordered_map<uint64_t, int> g_score;

        pq.push({calculateEntropyCycleHeuristic(start), start});
        parent[start] = {start, {-1, -1}};
        g_score[start] = 0;

        bool found = false;
        int expansions = 0;
        const int MAX_EXPANSIONS = 500000;

        while (!pq.empty() && expansions < MAX_EXPANSIONS) {
            uint64_t curr = pq.top().second;
            pq.pop();
            
            if (curr == target_state) {
                found = true;
                break;
            }
            
            expansions++;
            int curr_g = g_score[curr];

            for (int i = 0; i < n; ++i) {
                for (int b = 0; b < bit_levels; ++b) {
                    int j = i ^ (1 << b);
                    if (i < j) {
                        uint64_t val_i = (curr >> (i * 4)) & 15ULL;
                        uint64_t val_j = (curr >> (j * 4)) & 15ULL;

                        uint64_t next_state = curr;
                        next_state &= ~((15ULL << (i * 4)) | (15ULL << (j * 4)));
                        next_state |= (val_i << (j * 4)) | (val_j << (i * 4));

                        int tentative_g = curr_g + 1;

                        if (g_score.find(next_state) == g_score.end() || tentative_g < g_score[next_state]) {
                            parent[next_state] = {curr, {i, j}};
                            g_score[next_state] = tentative_g;
                            
                            double h = calculateEntropyCycleHeuristic(next_state);
                            double f = tentative_g + 2.0 * h; 
                            pq.push({f, next_state});
                        }
                    }
                }
            }
        }

        if (found) {
            std::vector<std::pair<int, int>> swap_order;
            uint64_t curr = target_state;
            while (curr != start) {
                auto p = parent[curr];
                swap_order.push_back(p.second);
                curr = p.first;
            }
            std::reverse(swap_order.begin(), swap_order.end());
            for (auto& p : swap_order) {
                flat_swaps.push_back(p.first);
                flat_swaps.push_back(p.second);
            }
        } else {
            flat_swaps.push_back(-1); // Indicator of failure
        }
        return flat_swaps;
    }
};

std::vector<int> route_packets(std::string algo, std::vector<int> perm) {
    HypercubeRouter router(perm);
    if (!router.isValidSize()) return {-1};
    
    if (algo == "bfs") {
        return router.solveWithBFS();
    } else if (algo == "merge") {
        return router.solveWithBitonicSort(perm);
    } else if (algo == "astar") {
        return router.solveWithAStar();
    } else if (algo == "entropy_cycle") {
        return router.solveWithEntropyCycle(perm);
    }
    return {-1};
}

EMSCRIPTEN_BINDINGS(my_module) {
    register_vector<int>("VectorInt");
    function("route_packets", &route_packets);
}
