// 輸入：(1) a, b, c, d, e, f, g, h
//      (2) a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p 
// 輸出：一個包含所有交換順序的 vector
// compile: g++ -O3 src/main.cpp -o src/bin/routing


#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>
#include <cstdint>
#include <unordered_map>
#include <algorithm>
#include <unordered_set>
#include <cmath>
#include <random>

class HypercubeRouter {
private:
    int n;
    int bit_levels;
    std::string start_state;
    std::string target_state;
    std::vector<double> precomputed_entropy;

    std::string pack_state(const std::vector<int>& perm) const {
        std::string state;
        state.reserve(perm.size());
        for (size_t i = 0; i < perm.size(); ++i) {
            state.push_back(static_cast<char>(perm[i]));
        }
        return state;
    }

    std::string get_target_state(int size) const {
        std::string state;
        state.reserve(size);
        for (int i = 0; i < size; ++i) {
            state.push_back(static_cast<char>(i));
        }
        return state;
    }

    int popcount(int x) const {
        return __builtin_popcount(x);
    }

    std::vector<int> unpack_state(const std::string& state) const {
        std::vector<int> perm(n);
        for (int i = 0; i < n; ++i) {
            perm[i] = static_cast<int>(static_cast<unsigned char>(state[i]));
        }
        return perm;
    }

    struct AStarState {
        std::string state;
        int g;
        int f;
        bool operator>(const AStarState& other) const {
            return f > other.f;
        }
    };

    int computeHeuristic(const std::string& state) const {
        int total_dist = 0;
        for (int i = 0; i < n; ++i) {
            int val = static_cast<int>(static_cast<unsigned char>(state[i]));
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

    bool solveWithBFS(std::vector<std::pair<int, int>>& swap_order) {
        if (start_state == target_state) return true;

        std::queue<std::string> q;
        std::unordered_map<std::string, std::pair<std::string, std::pair<int, int>>> parent;

        q.push(start_state);
        parent[start_state] = {start_state, {-1, -1}};

        bool found = false;

        while (!q.empty()) {
            std::string curr = q.front();
            q.pop();

            if (curr == target_state) {
                found = true;
                break;
            }

            for (int i = 0; i < n; ++i) {
                for (int b = 0; b < bit_levels; ++b) {
                    int j = i ^ (1 << b);
                    if (i < j) {
                        std::string next_state = curr;
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
            std::string curr = target_state;
            while (curr != start_state) {
                auto p = parent[curr];
                swap_order.push_back(p.second);
                curr = p.first;
            }
            std::reverse(swap_order.begin(), swap_order.end());
            return true;
        }
        return false;
    }

    bool solveWithBitonicSort(std::vector<int>& current_perm, std::vector<std::pair<int, int>>& swap_order) {
        int num_nodes = current_perm.size(); 

        for (int k = 2; k <= num_nodes; k *= 2) {
            for (int j = k / 2; j > 0; j /= 2) {
                for (int i = 0; i < num_nodes; i++) {
                    int neighbor = i ^ j; // 透過 XOR 找到這個維度上的相鄰節點
                    if (i < neighbor) {
                        bool ascending_order = ((i & k) == 0);
                        if ((current_perm[i] > current_perm[neighbor]) == ascending_order) {
                            std::swap(current_perm[i], current_perm[neighbor]);
                            swap_order.push_back({i, neighbor});
                        }
                    }
                }
            }
        }

        for (int i = 0; i < num_nodes; ++i) {
            if (current_perm[i] != i) return false;
        }
        return true;
    }

    bool solveWithAStar(std::vector<std::pair<int, int>>& swap_order) {
        if (start_state == target_state) return true;

        std::priority_queue<AStarState, std::vector<AStarState>, std::greater<AStarState>> pq;
        std::unordered_map<std::string, int> g_score;
        std::unordered_map<std::string, std::pair<std::string, std::pair<int, int>>> parent;

        int h_start = computeHeuristic(start_state);
        pq.push({start_state, 0, h_start});
        g_score[start_state] = 0;
        parent[start_state] = {start_state, {-1, -1}};

        bool found = false;

        while (!pq.empty()) {
            AStarState curr = pq.top();
            pq.pop();

            std::string curr_state = curr.state;

            if (curr_state == target_state) {
                found = true;
                break;
            }

            if (curr.g > g_score[curr_state]) continue;

            for (int i = 0; i < n; ++i) {
                for (int b = 0; b < bit_levels; ++b) {
                    int j = i ^ (1 << b);
                    if (i < j) {
                        std::string next_state = curr_state;
                        std::swap(next_state[i], next_state[j]);

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
            std::string curr = target_state;
            while (curr != start_state) {
                auto p = parent[curr];
                swap_order.push_back(p.second);
                curr = p.first;
            }
            std::reverse(swap_order.begin(), swap_order.end());
            return true;
        }
        return false;
    }

    // Removed calculateCycleHeuristic

    // Heuristic function combining Cycle Decomposition, Group Theory, and Information Theory
    double calculateEntropyCycleHeuristic(const std::string& state, int curr_g = 0) const {
        int cycles = 0;
        bool visited[256] = {false};
        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                cycles++;
                int curr = i;
                while (!visited[curr]) {
                    visited[curr] = true;
                    curr = static_cast<int>(static_cast<unsigned char>(state[curr]));
                }
            }
        }
        int group_swaps = n - cycles;

        double total_distance = 0;
        int error_counts[256] = {0};
        for (int i = 0; i < n; ++i) {
            int error = i ^ static_cast<int>(static_cast<unsigned char>(state[i])); 
            if (error != 0) {
                error_counts[error]++;
            }
            int dist = __builtin_popcount(error);
            total_distance += dist;
        }

        double entropy = 0.0;
        for (int i = 1; i < 256; ++i) {
            if (error_counts[i] > 0) {
                entropy += precomputed_entropy[error_counts[i]];
            }
        }

        double base_heuristic = std::max((double)group_swaps, total_distance / 2.0);
        
        // Adaptive Entropy Penalty: weight increases slightly as we get deeper
        double entropy_weight = 0.1 + 0.01 * curr_g;
        if (entropy_weight > 2.0) entropy_weight = 2.0;

        return base_heuristic + entropy_weight * entropy;
    }

    // Removed solveWithCycleDecomp

    // Algorithm 4: Entropy-Cycle Search (Cycle Decomp + Entropy)
    bool solveWithEntropyCycle(std::vector<int>& current_perm, std::vector<std::pair<int, int>>& swap_order) {
        std::string start = pack_state(current_perm);
        if (start == target_state) return true;

        std::priority_queue<std::pair<double, std::string>, std::vector<std::pair<double, std::string>>, std::greater<std::pair<double, std::string>>> pq;
        std::unordered_map<std::string, std::pair<std::string, std::pair<int, int>>> parent;
        std::unordered_map<std::string, int> g_score;

        pq.push({calculateEntropyCycleHeuristic(start, 0), start});
        parent[start] = {start, {-1, -1}};
        g_score[start] = 0;

        bool found = false;
        int expansions = 0;
        const int MAX_EXPANSIONS = 500000;

        while (!pq.empty() && expansions < MAX_EXPANSIONS) {
            std::string curr = pq.top().second;
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
                        std::string next_state = curr;
                        std::swap(next_state[i], next_state[j]);

                        int tentative_g = curr_g + 1;

                        if (g_score.find(next_state) == g_score.end() || tentative_g < g_score[next_state]) {
                            parent[next_state] = {curr, {i, j}};
                            g_score[next_state] = tentative_g;
                            
                            double h = calculateEntropyCycleHeuristic(next_state, tentative_g);
                            double f = tentative_g + 2.0 * h; 
                            pq.push({f, next_state});
                        }
                    }
                }
            }
        }

        if (found) {
            std::string curr = target_state;
            while (curr != start) {
                auto p = parent[curr];
                swap_order.push_back(p.second);
                curr = p.first;
            }
            std::reverse(swap_order.begin(), swap_order.end());
            return true;
        }
        return false;
    }
};

int main(int argc, char *argv[]) {
    if (argc >= 2) {
        std::string first_arg = argv[1];
        if (first_arg == "-h" || first_arg == "--help") {
            std::cout << "Usage: " << argv[0] << " -algo <merge/bfs/astar/entropy_cycle> <-default/-test> <comma_separated_numbers>\n";
            std::cout << "Example: " << argv[0] << " -algo merge -default 7,6,5,4,3,2,1,0\n";
            return 0;
        }
    }

    // 檢查參數數量是否足夠
    if (argc < 5) {
        std::cerr << "Usage: " << argv[0] << " -algo <merge/bfs/astar/entropy_cycle> <-default/-test> <comma_separated_numbers>\n";
        std::cerr << "Example: " << argv[0] << " -algo merge -default 7,6,5,4,3,2,1,0\n";
        std::cerr << "Use -h for help.\n";
        return 1;
    }

    std::string algo_flag = argv[1];
    if (algo_flag != "-algo") {
        std::cerr << "Error: Missing -algo flag.\n";
        std::cerr << "Usage: " << argv[0] << " -algo <merge/bfs/astar/entropy_cycle> <-default/-test> <comma_separated_numbers>\n";
        return 1;
    }

    std::string algo = argv[2];
    std::string mode = argv[3];
    std::string input = argv[4];
    bool isTestMode = (mode == "-test");

    if (mode != "-default" && mode != "-test") {
        if (isTestMode) std::cout << "-1\n";
        else std::cerr << "Error: Invalid mode. Use -default or -test.\n";
        return 1;
    }

    std::stringstream ss(input);
    std::string token;
    std::vector<int> perm;

    while (std::getline(ss, token, ',')) {
        perm.push_back(std::stoi(token));
    }

    HypercubeRouter router(perm);
    if (!router.isValidSize()) {
        if (isTestMode) std::cout << "-1\n";
        else std::cerr << "Error: The input size must be a power of 2.\n";
        return 1;
    }

    std::vector<std::pair<int, int>> swap_order;
    bool success = false; // 新增：用來記錄演算法是否成功找到路徑

    // 根據指令決定呼叫哪一種演算法 ▼▼▼
    if (algo == "bfs") {
        success = router.solveWithBFS(swap_order);
    } else if (algo == "merge") {
        std::vector<int> current_perm = perm;
        success = router.solveWithBitonicSort(current_perm, swap_order);
    } else if (algo == "astar") {
        success = router.solveWithAStar(swap_order);
    } else if (algo == "entropy_cycle") {
        std::vector<int> current_perm = perm; 
        success = router.solveWithEntropyCycle(current_perm, swap_order);
    } else {
        if (isTestMode) std::cout << "-1\n";
        else std::cerr << "Error: Unknown algorithm. Use bfs, merge, astar, or entropy_cycle.\n";
        return 1;
    }

    if (success) { 
        // 根據模式決定輸出格式
        if (isTestMode) {
            std::cout << swap_order.size() << "\n";
        } else {
            if (swap_order.empty()) {
                std::cout << "The array is already sorted. Swaps required: 0\n";
            } else {
                std::string algo_name;
                if (algo == "bfs") algo_name = "BFS";
                else if (algo == "merge") algo_name = "Merge Sort";
                else if (algo == "astar") algo_name = "A* Search";
                else if (algo == "entropy_cycle") algo_name = "Entropy-Cycle Search";
                std::cout << "Target aligned using " << algo_name << ". Swaps required: " << swap_order.size() << "\n\n";
                std::cout << "Swap Order Vector List:\n";
                
                std::vector<int> current_state = perm;
                std::cout << "Initial Packet Sequence: [";
                for (size_t j = 0; j < current_state.size(); ++j) {
                    std::cout << current_state[j] << (j == current_state.size() - 1 ? "" : ", ");
                }
                std::cout << "]\n";

                for (size_t i = 0; i < swap_order.size(); ++i) {
                    std::swap(current_state[swap_order[i].first], current_state[swap_order[i].second]);
                    std::cout << "Step " << (i + 1) << ": Swap index " 
                              << swap_order[i].first << " and " << swap_order[i].second << "\n"
                              << "  -> Packet sequence: [";
                    for (size_t j = 0; j < current_state.size(); ++j) {
                        std::cout << current_state[j] << (j == current_state.size() - 1 ? "" : ", ");
                    }
                    std::cout << "]\n";
                }
            }
        }
        return 0;
    } else {
        if (isTestMode) {
            std::cout << "-1\n";
        } else {
            std::cout << "No valid bit-level routing path found.\n";
        }
        return 1;
    }
}