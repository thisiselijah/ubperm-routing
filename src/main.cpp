// 輸入：(1) a, b, c, d, e, f, g, h
//      (2) a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p 
// 輸出：一個包含所有交換順序的 vector
// compile: g++ -O3 main.cpp -o bin\routing
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>
#include <unordered_map>
#include <algorithm>

// 超立方體繞徑路由器類別
class HypercubeRouter {
private:
    int n;
    int bit_levels;
    uint64_t start_state;
    uint64_t target_state;

    // 將排列陣列壓縮為單一 64-bit 整數
    uint64_t pack_state(const std::vector<int>& perm) const {
        uint64_t state = 0;
        for (size_t i = 0; i < perm.size(); ++i) {
            state |= (static_cast<uint64_t>(perm[i]) << (i * 4));
        }
        return state;
    }

    // 產生目標排序狀態：[0, 1, 2, ..., n-1]
    uint64_t get_target_state(int size) const {
        uint64_t state = 0;
        for (int i = 0; i < size; ++i) {
            state |= (static_cast<uint64_t>(i) << (i * 4));
        }
        return state;
    }

public:
    // 建構子：初始化狀態
    HypercubeRouter(const std::vector<int>& perm) {
        n = perm.size();
        bit_levels = (n == 8) ? 3 : 4;
        start_state = pack_state(perm);
        target_state = get_target_state(n);
    }

    // 檢查輸入大小是否合法
    bool isValidSize() const {
        return (n == 8 || n == 16);
    }

    // 核心 BFS 函式：已更名為 solveWithBFS
    bool solveWithBFS(std::vector<std::pair<int, int>>& swap_order) {
        if (start_state == target_state) {
            return true;
        }

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
    
    // 未來可以繼續在這裡加入：
    // bool solveWithConstructive(std::vector<std::pair<int, int>>& swap_order) { ... }
};

int main(int argc, char *argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <comma_separated_numbers>\n";
        std::cerr << "Example: " << argv[0] << " 15,0,10,4,3,11,1,7,8,5,6,2,12,9,14,13\n";
        return 1;
    }

    std::string input = argv[1];
    std::stringstream ss(input);
    std::string token;
    std::vector<int> perm;

    while (std::getline(ss, token, ',')) {
        perm.push_back(std::stoi(token));
    }

    HypercubeRouter router(perm);

    if (!router.isValidSize()) {
        std::cerr << "Error: The input must contain exactly 8 or 16 numbers.\n";
        return 1;
    }

    std::vector<std::pair<int, int>> swap_order;
    
    // 呼叫更名後的函式
    bool success = router.solveWithBFS(swap_order);

    if (success) {
        if (swap_order.empty()) {
            std::cout << "The array is already sorted. Swaps required: 0\n";
        } else {
            std::cout << "Target aligned using BFS. Swaps required: " << swap_order.size() << "\n\n";
            std::cout << "Swap Order Vector List:\n";
            for (size_t i = 0; i < swap_order.size(); ++i) {
                std::cout << "Step " << (i + 1) << ": Swap index " 
                          << swap_order[i].first << " and " << swap_order[i].second << "\n";
            }
        }
    } else {
        std::cout << "No valid bit-level routing path found.\n";
    }

    return 0;
}