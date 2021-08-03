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
days = np.linspace(0,400,401)
rewards = (5e6 + 180e6*days/365 - 90e6*days**2/365**2)*(days<365) + 100e6*(days>=365)

fig = plt.figure(figsize=(6, 4))
ax = plt.gca()
sns.lineplot(x=days, y=rewards/1e6)
ax.set_ylim((0, 110))
ax.set_xlim((0, 400))

ax.set_title("DFP tokens in circulation", pad=15, fontsize=16)
ax.set_xlabel("time [days]")
ax.set_ylabel("circulation [MM]")

plt.savefig('circulation.png', dpi=300)
plt.show()
