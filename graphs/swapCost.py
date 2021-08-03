import numpy as np
import pandas as pd
import matplotlib
from matplotlib import pyplot as plt
from matplotlib.transforms import ScaledTranslation
import seaborn as sns

matplotlib.rcParams['lines.linewidth'] = 3.0
matplotlib.rcParams['axes.linewidth'] = 2.0
matplotlib.rcParams['axes.labelweight'] = 'bold'
matplotlib.rcParams['axes.titleweight'] = 'bold'
matplotlib.rcParams['axes.grid'] = True
matplotlib.rcParams['font.weight'] = 'bold'
matplotlib.rcParams['font.size'] = 14


size = 10000
gas = {'Defi Plaza': 59844 * 20e9 * 2300 / 1e18, 'UniSwapV2': 118150 * 20e9 * 2300 / 1e18}
fee = {'Defi Plaza': size * 0.001, 'UniSwapV2': size * 0.003}
slippage = {'Defi Plaza': size**2 / 20e6, 'UniSwapV2': size**2 / 160e6}
cost = pd.DataFrame({'gas': gas, 'fee': fee, 'slippage': slippage})


fig = plt.figure(figsize=(5, 4))
ax = plt.gca()
colors = sns.color_palette("mako", as_cmap=True).colors
b1 = sns.barplot(x=cost.index, y=cost.sum(axis=1), data=cost, color=colors[196], label='slippage')
b2 = sns.barplot(x=cost.index, y=cost[['gas','fee']].sum(axis=1), data=cost, color=colors[128], label='fee')
b3 = sns.barplot(x=cost.index, y=cost['gas'], data=cost, color=colors[64], label='gas')
ax.tick_params(axis='x', which='major', pad=10)
ax.set_axisbelow(True)
ax.set_ylim(0,50)
ax.set_ylabel('transaction cost [$]', labelpad=10)
plt.title('10k$ swap cost comparison  ', pad=25, fontsize=20)
ax.legend()
barwidth = 0.5
for bar in ax.patches:
    x = bar.get_x()
    width = bar.get_width()
    centre = x+width/2.
    bar.set_x(centre-barwidth/2.)
    bar.set_width(barwidth)


plt.tight_layout()
plt.savefig('swapCost.png', dpi=300)
