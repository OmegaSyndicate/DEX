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
matplotlib.rcParams['font.size'] = 12

# Setup the axis

# Load and trend gas usage graph
fig = plt.figure(figsize=(6, 4))
ax = plt.gca()
gasUsed = pd.read_json("./ETH_to_LINK.json", typ='series').sort_values().iloc[:-1]
gasUsed.name = "gas used"
sns.barplot(x=gasUsed.index, y=gasUsed.values, palette="vlag", ax=ax)
ax.set_ylim((0, 2e5))
ax.set_title("ETH to LINK gas used [units]", pad=15, fontsize=16)
plt.setp(ax.get_xticklabels(), rotation=65, ha='center')
dx, dy = -10, 0
offset = ScaledTranslation(dx/fig.dpi, dy/fig.dpi, scale_trans=fig.dpi_scale_trans)
for label in ax.xaxis.get_majorticklabels():
    label.set_transform(label.get_transform() + offset)

plt.tight_layout()
plt.savefig('ETH_to_LINK_gas.png', dpi=300)
plt.show()


# Trend fee graph
fees = pd.Series({
    "DeFiPlaza": 0.1,
    "BalancerV2": 0.2524,
    "UniSwapV2": 0.5991,
    "UniSwapV3": 0.5991,
    "SushiSwap": 0.5991,
    "DefiSwap": 0.3,
    "Bancor": 0.36,
    "Behodler": 0.5
    })
fig = plt.figure(figsize=(6, 4))
ax = plt.gca()
sns.barplot(x=fees.index, y=fees.values, palette="vlag", ax=ax)
ax.set_ylim((0, 0.6))
ax.set_title("LINK to MATIC swap fees [%]", pad=15, fontsize=16)
plt.setp(ax.get_xticklabels(), rotation=65, ha='center')
dx, dy = -10, 0
offset = ScaledTranslation(dx/fig.dpi, dy/fig.dpi, scale_trans=fig.dpi_scale_trans)
for label in ax.xaxis.get_majorticklabels():
    label.set_transform(label.get_transform() + offset)

plt.tight_layout()
plt.savefig('ETH_to_LINK_fees.png', dpi=300)
plt.show()
