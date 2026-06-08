# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "matplotlib",
#     "scipy",
#     "numpy",
# ]
# ///

import matplotlib.pyplot as plt
from collections import Counter
import os
import argparse
import numpy as np
from scipy.interpolate import make_interp_spline
import datetime

def read_data(filename):
    if not os.path.exists(filename):
        return []
    with open(filename, 'r') as f:
        return [int(line.strip()) for line in f if line.strip().isdigit()]

def main():
    parser = argparse.ArgumentParser(description="Plot Approximation Curves")
    parser.add_argument("-save", action="store_true", help="Save the plot to an image instead of displaying it interactively.")
    args = parser.parse_args()

    bfs_data = read_data('data/bfs.txt')
    merge_data = read_data('data/merge.txt')
    astar_data = read_data('data/astar.txt')
    entropy_cycle_data = read_data('data/entropy_cycle.txt')

    time_slot = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs('data', exist_ok=True)
    summary_path = f'data/summary-{time_slot}.txt'

    with open(summary_path, 'w') as f_out:
        if not bfs_data and not merge_data and not astar_data and not entropy_cycle_data:
            f_out.write("No data found in data/bfs.txt, data/merge.txt, data/astar.txt, or data/entropy_cycle.txt. Please run test.py first.\n")
            print(f"No data found. Log written to {summary_path}")
            return

        def write_statistics(label, data):
            if not data:
                return
            mean = np.mean(data)
            median = np.median(data)
            min_val = np.min(data)
            max_val = np.max(data)
            std_dev = np.std(data)
            counts = Counter(data)
            
            f_out.write(f"--- {label} Statistical Summary ---\n")
            f_out.write(f"Total Cases: {len(data)}\n")
            f_out.write(f"Mean: {mean:.2f}, Median: {median:.2f}, Min: {min_val}, Max: {max_val}, Std Dev: {std_dev:.2f}\n")
            f_out.write(f"Step Distribution:\n")
            for step in sorted(counts.keys()):
                f_out.write(f"  {step} steps: {counts[step]} cases\n")
            f_out.write("\n")

        write_statistics('BFS', bfs_data)
        write_statistics('Merge Sort', merge_data)
        write_statistics('A* Search', astar_data)
        write_statistics('Entropy-Cycle Search', entropy_cycle_data)

    print(f"Statistical summary successfully written to {summary_path}")

    # Use a 2x3 grid to accommodate 4 histograms + 1 comparison curve
    fig, axs = plt.subplots(2, 3, figsize=(20, 12))
    ax1, ax2, ax3, ax4, ax5, ax6 = axs.flatten()

    # Dopamine Color Palette: Vibrant, energetic, high saturation
    color_bfs = '#3A86FF'      # Vibrant Blue
    color_merge = '#FF006E'    # Hot Pink
    color_astar = '#FFD166'    # Bright Yellow
    color_entropy_cycle = '#118AB2' # Vibrant Teal

    def plot_histogram(ax, data, color, label):
        if not data:
            ax.text(0.5, 0.5, 'No Data', horizontalalignment='center', verticalalignment='center', transform=ax.transAxes, fontsize=12, color='gray')
            ax.set_title(f"{label} Histogram")
            return
            
        counts = Counter(data)
        x = sorted(counts.keys())
        y = [counts[val] for val in x]
        
        ax.bar(x, y, color=color, edgecolor='none', alpha=0.9)
        ax.set_title(f"{label} Histogram", fontsize=14, fontweight='bold', color='#333333')
        ax.set_xlabel("Number of Swaps (Steps)", fontsize=12)
        ax.set_ylabel("Number of Cases", fontsize=12)
        ax.grid(axis='y', linestyle='--', alpha=0.4)

    def plot_curve(ax, data, color, label, linewidth=3.5, linestyle='-'):
        if not data:
            return
            
        counts = Counter(data)
        x = sorted(counts.keys())
        y = [counts[val] for val in x]
        
        if len(x) > 3:
            x_smooth = np.linspace(min(x), max(x), 300)
            spline = make_interp_spline(x, y, k=3)
            y_smooth = spline(x_smooth)
            y_smooth = np.maximum(y_smooth, 0)
            ax.plot(x_smooth, y_smooth, color=color, label=label, linewidth=linewidth, linestyle=linestyle, alpha=0.9)
        else:
            ax.plot(x, y, color=color, label=label, linewidth=linewidth, linestyle=linestyle, alpha=0.9, marker='o')

    # Histograms
    plot_histogram(ax1, bfs_data, color_bfs, 'BFS')
    plot_histogram(ax2, merge_data, color_merge, 'Merge Sort')
    plot_histogram(ax3, astar_data, color_astar, 'A* Search')
    plot_histogram(ax4, entropy_cycle_data, color_entropy_cycle, 'Entropy-Cycle Search')

    # Comparison Curves (ax5)
    plot_curve(ax5, bfs_data, color_bfs, 'BFS', linewidth=5.5, linestyle='-')
    plot_curve(ax5, merge_data, color_merge, 'Merge Sort', linewidth=3.5, linestyle='-')
    plot_curve(ax5, astar_data, color_astar, 'A* Search', linewidth=3, linestyle='-.')
    plot_curve(ax5, entropy_cycle_data, color_entropy_cycle, 'Entropy-Cycle Search', linewidth=3, linestyle='--')

    ax5.set_title("Approximation Curves Comparison", fontsize=14, fontweight='bold', color='#333333')
    ax5.set_xlabel("Number of Swaps (Steps)", fontsize=12)
    ax5.set_ylabel("Number of Cases", fontsize=12)
    ax5.grid(axis='both', linestyle='--', alpha=0.4)
    ax5.legend(fontsize=12, loc='upper right')

    ax6.axis('off')

    plt.suptitle("Hypercube Permutation Routing Comparison", fontsize=18, fontweight='bold', y=0.98)
    plt.tight_layout(rect=[0, 0, 1, 0.95])

    if args.save:
        os.makedirs('assets', exist_ok=True)
        save_path = f'assets/figure-{time_slot}.png'
        plt.savefig(save_path, dpi=300)
        print(f"Plot saved successfully to {save_path}")
    else:
        print("Displaying interactive plot...")
        plt.show()

if __name__ == "__main__":
    main()
