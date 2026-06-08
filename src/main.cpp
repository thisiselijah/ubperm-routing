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

    int popcount(int x) const {
        int count = 0;
        while (x) {
            count += (x & 1);
            x >>= 1;
        }
        return count;
    }

    std::vector<int> unpack_state(uint64_t state) const {
        std::vector<int> perm(n);
        for (int i = 0; i < n; ++i) {
            perm[i] = (state >> (i * 4)) & 15ULL;
        }
        return perm;
    }

    struct AStarState {
        uint64_t state;
        int g;
        int f;
        bool operator>(const AStarState& other) const {
            return f > other.f;
        }
    };

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

    bool solveWithBFS(std::vector<std::pair<int, int>>& swap_order) {
        if (start_state == target_state) return true;

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
            uint64_t curr = target_state;
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
            uint64_t curr = target_state;
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
};

int main(int argc, char *argv[]) {
    if (argc >= 2) {
        std::string first_arg = argv[1];
        if (first_arg == "-h" || first_arg == "--help") {
            std::cout << "Usage: " << argv[0] << " -algo <merge/bfs/astar> <-default/-test> <comma_separated_numbers>\n";
            std::cout << "Example: " << argv[0] << " -algo merge -default 7,6,5,4,3,2,1,0\n";
            return 0;
        }
    }

    // 檢查參數數量是否足夠
    if (argc < 5) {
        std::cerr << "Usage: " << argv[0] << " -algo <merge/bfs/astar> <-default/-test> <comma_separated_numbers>\n";
        std::cerr << "Example: " << argv[0] << " -algo merge -default 7,6,5,4,3,2,1,0\n";
        std::cerr << "Use -h for help.\n";
        return 1;
    }

    std::string algo_flag = argv[1];
    if (algo_flag != "-algo") {
        std::cerr << "Error: Missing -algo flag.\n";
        std::cerr << "Usage: " << argv[0] << " -algo <merge/bfs/astar> <-default/-test> <comma_separated_numbers>\n";
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
        else std::cerr << "Error: The input must contain exactly 8 or 16 numbers.\n";
        return 1;
    }

    std::vector<std::pair<int, int>> swap_order;
    bool success = false; // 新增：用來記錄演算法是否成功找到路徑

    // 根據指令決定呼叫哪一種演算法 ▼▼▼
    if (algo == "bfs") {
        success = router.solveWithBFS(swap_order);
    } else if (algo == "merge") {
        std::vector<int> current_perm = perm; // 複製一份陣列讓排序演算法去操作
        success = router.solveWithBitonicSort(current_perm, swap_order);
    } else if (algo == "astar") {
        success = router.solveWithAStar(swap_order);
    } else {
        if (isTestMode) std::cout << "-1\n";
        else std::cerr << "Error: Unknown algorithm. Use bfs, merge or astar.\n";
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
                std::cout << "Target aligned using " << algo_name << ". Swaps required: " << swap_order.size() << "\n\n";
                std::cout << "Swap Order Vector List:\n";
                for (size_t i = 0; i < swap_order.size(); ++i) {
                    std::cout << "Step " << (i + 1) << ": Swap index " 
                              << swap_order[i].first << " and " << swap_order[i].second << "\n";
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