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
import glob
import math

def read_data(filename):
    if not os.path.exists(filename):
        return []
    with open(filename, 'r') as f:
        return [int(line.strip()) for line in f if line.strip().isdigit()]

def main():
    parser = argparse.ArgumentParser(description="Plot Approximation Curves")
    parser.add_argument("-save", action="store_true", help="Save the plot to an image instead of displaying it interactively.")
    args = parser.parse_args()

    os.makedirs('data', exist_ok=True)
    
    # Dynamically find algorithm data files
    all_txt_files = glob.glob('data/algo/*.txt')
    algo_files = [f for f in all_txt_files if not os.path.basename(f).startswith('summary-') and not os.path.basename(f).startswith('data.output')]
    
    algo_data = {}
    for filepath in algo_files:
        algo_name = os.path.splitext(os.path.basename(filepath))[0]
        data = read_data(filepath)
        if data:
            algo_data[algo_name] = data

    time_slot = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    summary_path = f'data/summary-{time_slot}.txt'

    if not algo_data:
        with open(summary_path, 'w') as f_out:
            f_out.write("No valid algorithm data found in data/ directory.\n")
        print(f"No data found. Log written to {summary_path}")
        return

    with open(summary_path, 'w') as f_out:
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

        for algo_name, data in algo_data.items():
            write_statistics(algo_name, data)

    print(f"Statistical summary successfully written to {summary_path}")

    # Determine grid size (N algorithms + 1 comparison)
    num_plots = len(algo_data) + 1
    cols = min(3, num_plots)
    rows = math.ceil(num_plots / cols)

    fig, axs = plt.subplots(rows, cols, figsize=(6 * cols, 5 * rows))
    if num_plots == 1:
        axs = [axs]
    else:
        axs = axs.flatten()

    # Predefined colors (cycle through if needed)
    colors = ['#3A86FF', '#FF006E', '#FFD166', '#118AB2', '#9D4EDD', '#06D6A0', '#EF476F', '#118AB2', '#073B4C']
    
    def plot_histogram(ax, data, color, label):
        counts = Counter(data)
        x = sorted(counts.keys())
        y = [counts[val] for val in x]
        
        ax.bar(x, y, color=color, edgecolor='none', alpha=0.9)
        ax.set_title(f"{label} Histogram", fontsize=14, fontweight='bold', color='#333333')
        ax.set_xlabel("Number of Swaps (Steps)", fontsize=12)
        ax.set_ylabel("Number of Cases", fontsize=12)
        ax.grid(axis='y', linestyle='--', alpha=0.4)

    def plot_curve(ax, data, color, label):
        counts = Counter(data)
        x = sorted(counts.keys())
        y = [counts[val] for val in x]
        
        if len(x) > 3:
            x_smooth = np.linspace(min(x), max(x), 300)
            spline = make_interp_spline(x, y, k=3)
            y_smooth = spline(x_smooth)
            y_smooth = np.maximum(y_smooth, 0)
            ax.plot(x_smooth, y_smooth, color=color, label=label, linewidth=3, alpha=0.9)
        else:
            ax.plot(x, y, color=color, label=label, linewidth=3, alpha=0.9, marker='o')

    # Plot individual histograms
    comp_ax = axs[len(algo_data)]
    
    for idx, (algo_name, data) in enumerate(algo_data.items()):
        color = colors[idx % len(colors)]
        plot_histogram(axs[idx], data, color, algo_name)
        plot_curve(comp_ax, data, color, algo_name)

    # Setup comparison curve axis
    comp_ax.set_title("Approximation Curves Comparison", fontsize=14, fontweight='bold', color='#333333')
    comp_ax.set_xlabel("Number of Swaps (Steps)", fontsize=12)
    comp_ax.set_ylabel("Number of Cases", fontsize=12)
    comp_ax.grid(axis='both', linestyle='--', alpha=0.4)
    comp_ax.legend(fontsize=10, loc='upper right')

    # Hide unused subplots
    for idx in range(num_plots, len(axs)):
        axs[idx].axis('off')

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
