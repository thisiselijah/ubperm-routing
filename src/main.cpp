// 輸入：(1) a, b, c, d, e, f, g, h
//      (2) a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p 
// 輸出：一個包含所有交換順序的 vector
// compile: g++ -O3 main.cpp -o bin/routing


#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>
#include <cstdint>
#include <unordered_map>
#include <algorithm>

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
};

int main(int argc, char *argv[]) {
    // 檢查參數數量是否足夠 (程式名稱 + 模式 + 陣列)
    if (argc < 4) {
        std::cerr << "Usage: " << argv[0] << "<algo> <mode> <comma_separated_numbers>\n";
        std::cerr << "Modes: -default (verbose output) or -test (integer output only)\n";
        std::cerr << "Example: " << argv[0] << " -mergesort -default 7,6,5,4,3,2,1,0\n";
        return 1;
    }

    std::string algo = argv[1];
    std::string mode = argv[2];
    std::string input = argv[3];
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
    } else if (algo == "mergesort") {
        std::vector<int> current_perm = perm; // 複製一份陣列讓排序演算法去操作
        success = router.solveWithBitonicSort(current_perm, swap_order);
    } else {
        if (isTestMode) std::cout << "-1\n";
        else std::cerr << "Error: Unknown algorithm. Use bfs or mergesort.\n";
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
                std::string algo_name = (algo == "-bfs") ? "BFS" : "Merge Sort";
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