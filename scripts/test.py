# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "matplotlib",
# ]
# ///

import argparse
import subprocess
import itertools
import sys
import matplotlib.pyplot as plt
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed

def run_cpp_case(perm_tuple, exe_path):
    """
    呼叫 C++ 執行檔並回傳交換步數。
    強制使用 -test 模式以利解析。
    """
    perm_str = ",".join(map(str, perm_tuple))
    try:
        # 在參數列中加入 "-test" 標籤
        result = subprocess.run(
            [exe_path, "-test", perm_str], 
            capture_output=True, 
            text=True, 
            check=True
        )
        return int(result.stdout.strip())
    except subprocess.CalledProcessError:
        return -1
    except ValueError:
        return -1

def main():
    parser = argparse.ArgumentParser(description="Hypercube Routing Test Runner")
    parser.add_argument("-cube", type=int, required=True, help="超立方體維度 (例如 3 代表 8 個數字，4 代表 16 個數字)")
    parser.add_argument("-exe", type=str, default="src/bin/routing", help="C++ 執行檔的路徑")
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("-auto", action="store_true", help="窮舉並執行所有可能的排列 (警告：僅適用於 N=8)")
    group.add_argument("-text", type=str, help="從文字檔讀取測資 (每行一組逗號分隔的陣列)")

    args = parser.parse_args()
    
    n = 2 ** args.cube
    cases = []

    if args.auto:
        if args.cube >= 4:
            print("【嚴重警告】 4-cube (N=16) 有 16! (約 20.9 兆) 種排列，無法進行全域列舉！")
            print("請使用 -text <filename> 模式來測試特定測資。")
            sys.exit(1)
        
        print(f"正在產生 N={n} 的所有可能排列...")
        import math
        cases = list(itertools.permutations(range(n)))
        print(f"產生完畢！共 {len(cases)} 筆測資。")
        
    elif args.text:
        print(f"正在從 {args.text} 讀取測資...")
        try:
            with open(args.text, "r") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        cases.append(tuple(map(int, line.split(','))))
        except FileNotFoundError:
            print(f"錯誤：找不到檔案 {args.text}")
            sys.exit(1)
            
        print(f"讀取完畢！共 {len(cases)} 筆測資。")

    if not cases:
        print("沒有測資可供執行。")
        sys.exit(0)

    print("開始平行運算...")
    results = []
    
    with ThreadPoolExecutor() as executor:
        futures = {executor.submit(run_cpp_case, c, args.exe): c for c in cases}
        
        # 將原本的進度顯示區塊改成這樣：
        completed = 0
        total = len(cases)
        for future in as_completed(futures):
            results.append(future.result())
            completed += 1
            # 改為每 100 筆更新一次，並加上 flush=True
            if completed % 100 == 0 or completed == total:
                print(f"進度: {completed}/{total} ({(completed/total)*100:.1f}%)", end="\r", flush=True)
    
    print("\n所有運算完成！")

    valid_steps = [res for res in results if res >= 0]
    errors = len(results) - len(valid_steps)
    
    if errors > 0:
        print(f"注意：有 {errors} 筆測資執行失敗或找不到路徑。")

    if not valid_steps:
        print("沒有有效的結果可供繪圖。")
        sys.exit(0)

    step_counts = Counter(valid_steps)
    x_axis = sorted(step_counts.keys())
    y_axis = [step_counts[x] for x in x_axis]

    plt.figure(figsize=(10, 6))
    bars = plt.bar(x_axis, y_axis, color='skyblue', edgecolor='black')
    
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + (max(y_axis)*0.01), 
                 int(yval), ha='center', va='bottom', fontsize=9)

    plt.title(f"Hypercube Permutation Routing (N={n}) - BFS Search Steps Distribution", fontsize=14)
    plt.xlabel("Number of Swaps (Steps)", fontsize=12)
    plt.ylabel("Number of Cases", fontsize=12)
    
    plt.xticks(range(min(x_axis), max(x_axis) + 1))
    
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    main()