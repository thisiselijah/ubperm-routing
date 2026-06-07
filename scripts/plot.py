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

    if not bfs_data and not merge_data:
        print("No data found in data/bfs.txt or data/merge.txt. Please run test.py first.")
        return

    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(22, 6))

    # Dopamine Color Palette: Vibrant, energetic, high saturation
    color_bfs = '#3A86FF'  # Vibrant Blue
    color_merge = '#FF006E'  # Hot Pink

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

    def plot_curve(ax, data, color, label):
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
            ax.plot(x_smooth, y_smooth, color=color, label=label, linewidth=3.5, alpha=0.9)
        else:
            ax.plot(x, y, color=color, label=label, linewidth=3.5, alpha=0.9)

    # 1. Bar Chart for BFS
    plot_histogram(ax1, bfs_data, color_bfs, 'BFS')
    
    # 2. Bar Chart for Merge Sort
    plot_histogram(ax2, merge_data, color_merge, 'Merge Sort')
    
    # 3. Smoothing Approximation Curves
    plot_curve(ax3, bfs_data, color_bfs, 'BFS')
    plot_curve(ax3, merge_data, color_merge, 'Merge Sort')
    ax3.set_title("Approximation Curves Comparison", fontsize=14, fontweight='bold', color='#333333')
    ax3.set_xlabel("Number of Swaps (Steps)", fontsize=12)
    ax3.set_ylabel("Number of Cases", fontsize=12)
    ax3.grid(axis='both', linestyle='--', alpha=0.4)
    ax3.legend(fontsize=12, loc='upper right')

    plt.suptitle("Hypercube Permutation Routing Comparison", fontsize=18, fontweight='bold', y=1.05)
    plt.tight_layout()

    if args.save:
        os.makedirs('data', exist_ok=True)
        save_path = 'data/distribution_curve.png'
        plt.savefig(save_path, dpi=300)
        print(f"Plot saved successfully to {save_path}")
    else:
        print("Displaying interactive plot...")
        plt.show()

if __name__ == "__main__":
    main()
