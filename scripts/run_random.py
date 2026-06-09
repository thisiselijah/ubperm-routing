import argparse
import random
import subprocess
import sys

def main():
    parser = argparse.ArgumentParser(description="Run a random permutation test")
    parser.add_argument("-cube", type=int, required=True, help="Dimension of the hypercube")
    parser.add_argument("-algo", type=str, default="stochastic", choices=["bfs", "merge", "astar", "entropy_cycle", "beam_search", "stochastic"], help="Algorithm to use")
    parser.add_argument("-exe", type=str, default="src/bin/routing", help="Executable path")
    args = parser.parse_args()

    n = 2 ** args.cube
    perm = list(range(n))
    random.shuffle(perm)
    perm_str = ",".join(map(str, perm))

    print(f"--- Random Permutation Test ---")
    print(f"Cube Dimension: {args.cube} (N={n})")
    print(f"Algorithm: {args.algo}")
    if n <= 64:
        print(f"Random Permutation: {perm_str}")
    else:
        print(f"Random Permutation: [Array of {n} elements (hidden due to size)]")

    cmd = [args.exe, "-algo", args.algo, "-default", perm_str]
    
    print("\nRunning...")
    try:
        result = subprocess.run(cmd, text=True)
        if result.returncode != 0:
            print(f"Execution failed with return code {result.returncode}")
    except FileNotFoundError:
        print(f"Error: Executable {args.exe} not found. Please compile the C++ code first.")
        sys.exit(1)

if __name__ == "__main__":
    main()
