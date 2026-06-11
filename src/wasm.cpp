#include <emscripten/bind.h>
#include <vector>
#include <queue>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <algorithm>
#include <cstdint>
#include <random>

using namespace emscripten;

class HypercubeRouter {
private:
    int n;
    int bit_levels;
    std::u16string start_state;
    std::u16string target_state;
    std::vector<double> precomputed_entropy;

    std::u16string pack_state(const std::vector<int>& perm) const {
        std::u16string state;
        state.reserve(perm.size());
        for (size_t i = 0; i < perm.size(); ++i) {
            state.push_back(static_cast<char16_t>(perm[i]));
        }
        return state;
    }

    std::u16string get_target_state(int size) const {
        std::u16string state;
        state.reserve(size);
        for (int i = 0; i < size; ++i) {
            state.push_back(static_cast<char16_t>(i));
        }
        return state;
    }

    struct AStarState {
        std::u16string state;
        int g;
        int f;
        bool operator>(const AStarState& other) const {
            return f > other.f;
        }
    };

    int popcount(int x) const {
        return __builtin_popcount(x);
    }

    int computeHeuristic(const std::u16string& state) const {
        int total_dist = 0;
        for (int i = 0; i < n; ++i) {
            int val = static_cast<int>(static_cast<char16_t>(state[i]));
            total_dist += popcount(i ^ val);
        }
        return (total_dist + 1) / 2;
    }

public:
    HypercubeRouter(const std::vector<int>& perm) {
        n = perm.size();
        bit_levels = 0;
        int temp = n;
        while (temp > 1) {
            bit_levels++;
            temp >>= 1;
        }
        if (n > 0) {
            start_state = pack_state(perm);
            target_state = get_target_state(n);
            precomputed_entropy.resize(n + 1, 0.0);
            for (int count = 1; count <= n; ++count) {
                double p = static_cast<double>(count) / n;
                precomputed_entropy[count] = -p * std::log2(p);
            }
        }
    }

    bool isValidSize() const {
        return (n > 0 && (n & (n - 1)) == 0);
    }

    std::vector<int> solveWithBFS() {
        std::vector<int> flat_swaps;
        if (start_state == target_state) return flat_swaps;

        std::queue<std::u16string> q;
        std::unordered_map<std::u16string, std::pair<std::u16string, std::pair<int, int>>> parent;

        q.push(start_state);
        parent[start_state] = {start_state, {-1, -1}};

        bool found = false;

        while (!q.empty()) {
            std::u16string curr = q.front();
            q.pop();

            if (curr == target_state) {
                found = true;
                break;
            }

            for (int i = 0; i < n; ++i) {
                for (int b = 0; b < bit_levels; ++b) {
                    int j = i ^ (1 << b);
                    if (i < j) {
                        std::u16string next_state = curr;
                        std::swap(next_state[i], next_state[j]);

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
            std::u16string curr = target_state;
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

        std::vector<int> target_inv_fwd(n);
        for (int i = 0; i < n; ++i) target_inv_fwd[static_cast<char16_t>(target_state[i])] = i;
        
        std::vector<int> target_inv_bwd(n);
        for (int i = 0; i < n; ++i) target_inv_bwd[static_cast<char16_t>(start_state[i])] = i;

        auto calc_h = [&](const std::u16string& state, const std::vector<int>& inv) {
            int dist = 0;
            for (int i = 0; i < n; ++i) {
                int p = static_cast<char16_t>(state[i]);
                int target_pos = inv[p];
                dist += __builtin_popcount(i ^ target_pos);
            }
            return dist / 2;
        };

        std::priority_queue<AStarState, std::vector<AStarState>, std::greater<AStarState>> pq_fwd, pq_bwd;
        std::unordered_map<std::u16string, int> g_fwd, g_bwd;
        std::unordered_map<std::u16string, std::pair<std::u16string, std::pair<int, int>>> parent_fwd, parent_bwd;

        pq_fwd.push({start_state, 0, calc_h(start_state, target_inv_fwd)});
        g_fwd[start_state] = 0;
        parent_fwd[start_state] = {start_state, {-1, -1}};

        pq_bwd.push({target_state, 0, calc_h(target_state, target_inv_bwd)});
        g_bwd[target_state] = 0;
        parent_bwd[target_state] = {target_state, {-1, -1}};

        int best_cost = 1e9;
        std::u16string meet_node = u"";

        while (!pq_fwd.empty() && !pq_bwd.empty()) {
            if (pq_fwd.top().f + pq_bwd.top().f >= best_cost) break;

            AStarState curr_f = pq_fwd.top();
            pq_fwd.pop();
            
            if (curr_f.g <= g_fwd[curr_f.state]) {
                for (int i = 0; i < n; ++i) {
                    for (int b = 0; b < bit_levels; ++b) {
                        int j = i ^ (1 << b);
                        if (i < j) {
                            std::u16string next_state = curr_f.state;
                            std::swap(next_state[i], next_state[j]);
                            int ten_g = curr_f.g + 1;
                            
                            if (g_fwd.find(next_state) == g_fwd.end() || ten_g < g_fwd[next_state]) {
                                g_fwd[next_state] = ten_g;
                                parent_fwd[next_state] = {curr_f.state, {i, j}};
                                pq_fwd.push({next_state, ten_g, ten_g + calc_h(next_state, target_inv_fwd)});
                                
                                if (g_bwd.count(next_state)) {
                                    int cost = ten_g + g_bwd[next_state];
                                    if (cost < best_cost) {
                                        best_cost = cost;
                                        meet_node = next_state;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            AStarState curr_b = pq_bwd.top();
            pq_bwd.pop();
            
            if (curr_b.g <= g_bwd[curr_b.state]) {
                for (int i = 0; i < n; ++i) {
                    for (int b = 0; b < bit_levels; ++b) {
                        int j = i ^ (1 << b);
                        if (i < j) {
                            std::u16string next_state = curr_b.state;
                            std::swap(next_state[i], next_state[j]);
                            int ten_g = curr_b.g + 1;
                            
                            if (g_bwd.find(next_state) == g_bwd.end() || ten_g < g_bwd[next_state]) {
                                g_bwd[next_state] = ten_g;
                                parent_bwd[next_state] = {curr_b.state, {i, j}};
                                pq_bwd.push({next_state, ten_g, ten_g + calc_h(next_state, target_inv_bwd)});
                                
                                if (g_fwd.count(next_state)) {
                                    int cost = ten_g + g_fwd[next_state];
                                    if (cost < best_cost) {
                                        best_cost = cost;
                                        meet_node = next_state;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (meet_node != u"") {
            std::vector<std::pair<int, int>> swap_order;
            std::u16string curr = meet_node;
            while (curr != start_state) {
                auto p = parent_fwd[curr];
                swap_order.push_back(p.second);
                curr = p.first;
            }
            std::reverse(swap_order.begin(), swap_order.end());
            
            curr = meet_node;
            while (curr != target_state) {
                auto p = parent_bwd[curr];
                swap_order.push_back(p.second);
                curr = p.first;
            }

            for (auto p : swap_order) {
                flat_swaps.push_back(p.first);
                flat_swaps.push_back(p.second);
            }
        } else {
            flat_swaps.push_back(-1); // Indicator of failure
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

    double calculateEntropyCycleHeuristic(const std::u16string& state, int curr_g = 0) const {
        int cycles = 0;
        std::vector<bool> visited(n, false);
        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                cycles++;
                int curr = i;
                while (!visited[curr]) {
                    visited[curr] = true;
                    curr = static_cast<int>(static_cast<char16_t>(state[curr]));
                }
            }
        }
        int group_swaps = n - cycles;

        double total_distance = 0;
        std::vector<int> error_counts(n, 0);
        for (int i = 0; i < n; ++i) {
            int error = i ^ static_cast<int>(static_cast<char16_t>(state[i])); 
            if (error != 0) {
                error_counts[error]++;
            }
            int dist = __builtin_popcount(error);
            total_distance += dist;
        }

        double entropy = 0.0;
        for (int i = 1; i < n; ++i) {
            if (error_counts[i] > 0) {
                entropy += precomputed_entropy[error_counts[i]];
            }
        }

        double base_heuristic = std::max((double)group_swaps, total_distance / 2.0);
        
        // Strict Tie-Breaker: Entropy penalty is bounded < 0.5 to preserve Admissibility of base_heuristic
        double adaptive_weight = 0.05 + 0.005 * curr_g;
        if (adaptive_weight > 0.49) adaptive_weight = 0.49;
        double entropy_penalty = (entropy / (double)bit_levels) * adaptive_weight;

        return base_heuristic + entropy_penalty;
    }

    // Removed solveWithCycleDecomp

    std::vector<int> solveWithEntropyCycle(std::vector<int> current_perm) {
        std::vector<int> flat_swaps;
        std::u16string start = pack_state(current_perm);
        if (start == target_state) return flat_swaps;

        std::priority_queue<std::pair<double, std::u16string>, std::vector<std::pair<double, std::u16string>>, std::greater<std::pair<double, std::u16string>>> pq;
        std::unordered_map<std::u16string, std::pair<std::u16string, std::pair<int, int>>> parent;
        std::unordered_map<std::u16string, int> g_score;

        pq.push({calculateEntropyCycleHeuristic(start, 0), start});
        parent[start] = {start, {-1, -1}};
        g_score[start] = 0;

        bool found = false;
        int expansions = 0;
        const int MAX_EXPANSIONS = 500000;

        while (!pq.empty() && expansions < MAX_EXPANSIONS) {
            std::u16string curr = pq.top().second;
            pq.pop();
            
            if (curr == target_state) {
                found = true;
                break;
            }
            
            expansions++;
            int curr_g = g_score[curr];

            // --- O(1) Delta Update Pre-computation ---
            int base_cycles = 0;
            std::vector<int> cycle_id(n, -1);
            for (int k = 0; k < n; k++) {
                if (cycle_id[k] == -1) {
                    int c = k;
                    while (cycle_id[c] == -1) {
                        cycle_id[c] = base_cycles;
                        c = static_cast<int>(static_cast<char16_t>(curr[c]));
                    }
                    base_cycles++;
                }
            }
            int base_group_swaps = n - base_cycles;

            int base_distance = 0;
            std::vector<int> error_counts(n, 0);
            for (int k = 0; k < n; ++k) {
                int error = k ^ static_cast<int>(static_cast<char16_t>(curr[k])); 
                if (error != 0) error_counts[error]++;
                base_distance += __builtin_popcount(error);
            }

            double base_entropy = 0.0;
            for (int k = 1; k < n; ++k) {
                if (error_counts[k] > 0) base_entropy += precomputed_entropy[error_counts[k]];
            }
            // ----------------------------------------

            for (int i = 0; i < n; ++i) {
                for (int b = 0; b < bit_levels; ++b) {
                    int j = i ^ (1 << b);
                    if (i < j) {
                        std::u16string next_state = curr;
                        std::swap(next_state[i], next_state[j]);

                        int tentative_g = curr_g + 1;

                        if (g_score.find(next_state) == g_score.end() || tentative_g < g_score[next_state]) {
                            // -- O(1) Delta Update --
                            int new_group_swaps = base_group_swaps;
                            if (cycle_id[i] == cycle_id[j]) {
                                new_group_swaps--;
                            } else {
                                new_group_swaps++;
                            }

                            int e_i = i ^ static_cast<int>(static_cast<char16_t>(curr[i]));
                            int e_j = j ^ static_cast<int>(static_cast<char16_t>(curr[j]));
                            int ne_i = i ^ static_cast<int>(static_cast<char16_t>(curr[j]));
                            int ne_j = j ^ static_cast<int>(static_cast<char16_t>(curr[i]));
                            
                            int new_distance = base_distance 
                                - __builtin_popcount(e_i) - __builtin_popcount(e_j) 
                                + __builtin_popcount(ne_i) + __builtin_popcount(ne_j);

                            double new_entropy = base_entropy;
                            auto remove_err = [&](int e) {
                                if (e != 0) {
                                    new_entropy -= precomputed_entropy[error_counts[e]];
                                    error_counts[e]--;
                                    if (error_counts[e] > 0) new_entropy += precomputed_entropy[error_counts[e]];
                                }
                            };
                            auto add_err = [&](int e) {
                                if (e != 0) {
                                    if (error_counts[e] > 0) new_entropy -= precomputed_entropy[error_counts[e]];
                                    error_counts[e]++;
                                    new_entropy += precomputed_entropy[error_counts[e]];
                                }
                            };
                            
                            remove_err(e_i); remove_err(e_j);
                            add_err(ne_i); add_err(ne_j);
                            
                            double base_h = std::max((double)new_group_swaps, new_distance / 2.0);
                            double adaptive_weight = 0.05 + 0.005 * tentative_g;
                            if (adaptive_weight > 0.49) adaptive_weight = 0.49;
                            double h = base_h + (new_entropy / 8.0) * adaptive_weight;

                            remove_err(ne_j); remove_err(ne_i);
                            add_err(e_j); add_err(e_i);
                            // -----------------------

                            parent[next_state] = {curr, {i, j}};
                            g_score[next_state] = tentative_g;
                            
                            double f = tentative_g + 2.0 * h; 
                            pq.push({f, next_state});
                        }
                    }
                }
            }
        }

        if (found) {
            std::vector<std::pair<int, int>> swap_order;
            std::u16string curr = target_state;
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

    struct BeamNode {
        std::u16string state;
        double h;
        std::u16string parent_state;
        std::pair<int, int> move;

        bool operator<(const BeamNode& other) const {
            return h < other.h;
        }
    };

    std::vector<int> solveWithBeamSearch(std::vector<int> current_perm) {
        std::vector<int> flat_swaps;
        std::u16string start = pack_state(current_perm);
        if (start == target_state) return flat_swaps;

        int beam_width = 100;
        int max_depth = n * 20;

        std::vector<std::u16string> beam;
        beam.push_back(start);
        
        std::unordered_set<std::u16string> global_visited;
        global_visited.insert(start);
        
        std::unordered_map<std::u16string, std::pair<std::u16string, std::pair<int, int>>> parent;
        parent[start] = {start, {-1, -1}};

        for (int depth = 0; depth < max_depth; ++depth) {
            std::vector<BeamNode> next_candidates;
            
            for (const auto& curr_state : beam) {
                if (curr_state == target_state) {
                    std::vector<std::pair<int, int>> swap_order;
                    std::u16string curr = curr_state;
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
                    return flat_swaps;
                }

                // --- O(1) Delta Update Pre-computation for Beam Search ---
                int base_cycles = 0;
                std::vector<int> cycle_id(n, -1);
                for (int k = 0; k < n; k++) {
                    if (cycle_id[k] == -1) {
                        int c = k;
                        while (cycle_id[c] == -1) {
                            cycle_id[c] = base_cycles;
                            c = static_cast<int>(static_cast<char16_t>(curr_state[c]));
                        }
                        base_cycles++;
                    }
                }
                int base_group_swaps = n - base_cycles;

                int base_distance = 0;
                std::vector<int> error_counts(n, 0);
                for (int k = 0; k < n; ++k) {
                    int error = k ^ static_cast<int>(static_cast<char16_t>(curr_state[k])); 
                    if (error != 0) error_counts[error]++;
                    base_distance += __builtin_popcount(error);
                }

                double base_entropy = 0.0;
                for (int k = 1; k < n; ++k) {
                    if (error_counts[k] > 0) base_entropy += precomputed_entropy[error_counts[k]];
                }
                // ---------------------------------------------------------

                for (int i = 0; i < n; ++i) {
                    for (int b = 0; b < bit_levels; ++b) {
                        int j = i ^ (1 << b);
                        if (i < j) {
                            std::u16string next_state = curr_state;
                            std::swap(next_state[i], next_state[j]);

                            if (global_visited.find(next_state) == global_visited.end()) {
                                // -- O(1) Delta Update --
                                int new_group_swaps = base_group_swaps;
                                if (cycle_id[i] == cycle_id[j]) {
                                    new_group_swaps--;
                                } else {
                                    new_group_swaps++;
                                }

                                int e_i = i ^ static_cast<int>(static_cast<char16_t>(curr_state[i]));
                                int e_j = j ^ static_cast<int>(static_cast<char16_t>(curr_state[j]));
                                int ne_i = i ^ static_cast<int>(static_cast<char16_t>(curr_state[j]));
                                int ne_j = j ^ static_cast<int>(static_cast<char16_t>(curr_state[i]));
                                
                                int new_distance = base_distance 
                                    - __builtin_popcount(e_i) - __builtin_popcount(e_j) 
                                    + __builtin_popcount(ne_i) + __builtin_popcount(ne_j);

                                double new_entropy = base_entropy;
                                auto remove_err = [&](int e) {
                                    if (e != 0) {
                                        new_entropy -= precomputed_entropy[error_counts[e]];
                                        error_counts[e]--;
                                        if (error_counts[e] > 0) new_entropy += precomputed_entropy[error_counts[e]];
                                    }
                                };
                                auto add_err = [&](int e) {
                                    if (e != 0) {
                                        if (error_counts[e] > 0) new_entropy -= precomputed_entropy[error_counts[e]];
                                        error_counts[e]++;
                                        new_entropy += precomputed_entropy[error_counts[e]];
                                    }
                                };
                                
                                remove_err(e_i); remove_err(e_j);
                                add_err(ne_i); add_err(ne_j);
                                
                                double base_h = std::max((double)new_group_swaps, new_distance / 2.0);
                                double adaptive_weight = 0.05 + 0.005 * (depth + 1);
                                if (adaptive_weight > 0.49) adaptive_weight = 0.49;
                                double h = base_h + (new_entropy / 8.0) * adaptive_weight;

                                remove_err(ne_j); remove_err(ne_i);
                                add_err(e_j); add_err(e_i);
                                // -----------------------

                                next_candidates.push_back({next_state, h, curr_state, {i, j}});
                            }
                        }
                    }
                }
            }

            if (next_candidates.empty()) break;

            int keep = std::min((int)next_candidates.size(), beam_width * 2);
            std::partial_sort(next_candidates.begin(), next_candidates.begin() + keep, next_candidates.end());
            
            beam.clear();
            for (int k = 0; k < next_candidates.size(); ++k) {
                const auto& cand = next_candidates[k];
                if (global_visited.find(cand.state) == global_visited.end()) {
                    global_visited.insert(cand.state);
                    parent[cand.state] = {cand.parent_state, cand.move};
                    beam.push_back(cand.state);
                    if (beam.size() >= beam_width) break;
                }
            }
        }
        
        flat_swaps.push_back(-1);
        return flat_swaps;
    }
std::vector<int> solveWithStochasticSearch(std::vector<int>& current_perm) {
        std::vector<int> flat_swaps;
        std::u16string target = get_target_state(n);
        std::u16string start = pack_state(current_perm);
        if (start == target) return flat_swaps;

        int max_restarts = 50;
        int max_steps_per_restart = n * 10;
        int D = std::log2(n);
        
        for (int r = 0; r < max_restarts; ++r) {
            std::u16string curr_state = start;
            std::vector<std::pair<int, int>> current_swaps;
            std::unordered_set<std::u16string> tabu_list;
            tabu_list.insert(curr_state);

            for (int step = 0; step < max_steps_per_restart; ++step) {
                if (curr_state == target) {
                    for (const auto& s : current_swaps) {
                        flat_swaps.push_back(s.first);
                        flat_swaps.push_back(s.second);
                    }
                    return flat_swaps;
                }

                // --- O(1) Delta Update Pre-computation ---
                int base_cycles = 0;
                std::vector<int> cycle_id(n, -1);
                for (int i = 0; i < n; ++i) {
                    if (cycle_id[i] == -1) {
                        base_cycles++;
                        int c = i;
                        while (cycle_id[c] == -1) {
                            cycle_id[c] = base_cycles;
                            c = static_cast<int>(static_cast<char16_t>(curr_state[c]));
                        }
                    }
                }
                int base_group_swaps = n - base_cycles;

                int base_distance = 0;
                std::vector<int> error_counts(n, 0);
                for (int k = 0; k < n; ++k) {
                    int error = k ^ static_cast<int>(static_cast<char16_t>(curr_state[k])); 
                    if (error != 0) error_counts[error]++;
                    base_distance += __builtin_popcount(error);
                }

                double base_entropy = 0.0;
                for (int k = 1; k < n; ++k) {
                    if (error_counts[k] > 0) base_entropy += precomputed_entropy[error_counts[k]];
                }
                // -----------------------------------------

                std::vector<std::pair<std::u16string, std::pair<int, int>>> neighbors;
                std::vector<double> probabilities;
                double sum_exp = 0.0;
                double best_h = 1e9;

                for (int i = 0; i < n; ++i) {
                    for (int d = 0; d < D; ++d) {
                        int j = i ^ (1 << d);
                        if (i < j) {
                            std::u16string next_state = curr_state;
                            std::swap(next_state[i], next_state[j]);
                            if (tabu_list.count(next_state)) continue;

                            // -- O(1) Delta Update --
                            int new_group_swaps = base_group_swaps;
                            if (cycle_id[i] == cycle_id[j]) {
                                new_group_swaps--;
                            } else {
                                new_group_swaps++;
                            }

                            int e_i = i ^ static_cast<int>(static_cast<char16_t>(curr_state[i]));
                            int e_j = j ^ static_cast<int>(static_cast<char16_t>(curr_state[j]));
                            int ne_i = i ^ static_cast<int>(static_cast<char16_t>(curr_state[j]));
                            int ne_j = j ^ static_cast<int>(static_cast<char16_t>(curr_state[i]));
                            
                            int new_distance = base_distance 
                                - __builtin_popcount(e_i) - __builtin_popcount(e_j) 
                                + __builtin_popcount(ne_i) + __builtin_popcount(ne_j);

                            double new_entropy = base_entropy;
                            auto update_entropy = [&](int e, int delta) {
                                if (e == 0) return;
                                new_entropy -= precomputed_entropy[error_counts[e]];
                                error_counts[e] += delta;
                                new_entropy += precomputed_entropy[error_counts[e]];
                            };
                            
                            update_entropy(e_i, -1);
                            if (e_i != e_j) update_entropy(e_j, -1);
                            else error_counts[e_i]--; 
                            
                            update_entropy(ne_i, 1);
                            if (ne_i != ne_j) update_entropy(ne_j, 1);
                            else error_counts[ne_i]++;

                            double h = new_distance + new_group_swaps * 2.0 + (new_entropy / D) * 0.49;

                            update_entropy(ne_i, -1);
                            if (ne_i != ne_j) update_entropy(ne_j, -1);
                            else error_counts[ne_i]--;
                            
                            update_entropy(e_i, 1);
                            if (e_i != e_j) update_entropy(e_j, 1);
                            else error_counts[e_i]++;

                            if (h < best_h) best_h = h;
                            
                            neighbors.push_back({next_state, {i, j}});
                            probabilities.push_back(h);
                        }
                    }
                }

                if (neighbors.empty()) break;

                for (size_t k = 0; k < probabilities.size(); ++k) {
                    double p = std::exp(-3.0 * (probabilities[k] - best_h)); 
                    probabilities[k] = p;
                    sum_exp += p;
                }

                double rand_val = (rand() / (double)RAND_MAX) * sum_exp;
                double cumulative = 0.0;
                int chosen = -1;
                for (size_t k = 0; k < probabilities.size(); ++k) {
                    cumulative += probabilities[k];
                    if (rand_val <= cumulative) {
                        chosen = k;
                        break;
                    }
                }
                if (chosen == -1) chosen = probabilities.size() - 1;

                curr_state = neighbors[chosen].first;
                current_swaps.push_back(neighbors[chosen].second);
                tabu_list.insert(curr_state);
            }
        }
        flat_swaps.push_back(-1);
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
    } else if (algo == "beam_search") {
        return router.solveWithBeamSearch(perm);
    } else if (algo == "stochastic") {
        return router.solveWithStochasticSearch(perm);
    } else {
        return {-1};
    }
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::register_vector<int>("VectorInt");
    emscripten::function("route_packets", &route_packets);
}
