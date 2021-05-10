pragma solidity ^0.7.6;

import "./derived/ERC20Lean.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Staking Token (STK)
 * @author Alberto Cuesta Canada
 * @notice Implements a basic ERC20 staking token with incentive distribution.
 */
contract DPLgov is ERC20, Ownable {
    using SafeMath for uint256;

    event staked(address staker, uint256 LPamount);
    event unstaked(address staker, uint256 LPamount, uint256 rewards);

    struct StakingState {
        uint96 totalStake;                      // Total LP tokens currently staked
        uint96 rewardsAccumulatedPerLP;         // Rewards accumulated per staked LP token (16.80 bits)
        uint32 lastUpdate;                      // Timestamp of last update
        uint32 startTime;                       // Timestamp rewards started
    }

    struct StakeData {
        uint96 stake;                           // Amount of LPs staked for this staker
        uint96 rewardsPerLPAtTimeStaked;        // Baseline rewards at the time these LPs were staked
    }

    address public founder;
    address public multisig;
    address public indexToken;
    StakingState public stakingState;
    mapping(address => StakeData) public stakerData;
    uint256 multisigAllocationClaimed;
    uint256 founderAllocationClaimed;

    constructor(address indexTokenAddress, address founderAddress) ERC20("DeFi Plaza governance token", "DPL") {
        indexToken = indexTokenAddress;
        founder = founderAddress;

        StakingState memory state;
        state.startTime = 1622498400;
        stakingState = state;
    }

    function stake(uint96 LPamount)
        public
        returns(bool success)
    {
        require(
            IERC20(indexToken).transferFrom(msg.sender, address(this), LPamount),
            "DPL: Transfer failed."
        );
        StakingState memory state = stakingState;

        if ((block.timestamp >= state.startTime) && (state.lastUpdate < 31536000)) {
            uint256 t1 = block.timestamp - state.startTime;       // calculate time relative to start time
            t1 = (t1 > 31536000) ? 31536000 : t1;                 // clamp at 1 year
            uint256 R1 = 170e24 * t1 / 31536000 - 85e24 * t1 * t1 / 994519296000000;
            uint256 R0 = 170e24 * state.lastUpdate / 31536000 - 85e24 * state.lastUpdate * state.lastUpdate / 994519296000000;
            state.rewardsAccumulatedPerLP += uint96(((R1 - R0) << 80) / state.totalStake);
            state.lastUpdate = uint32(t1);
        }
        state.totalStake += LPamount;
        stakingState = state;

        StakeData memory staker = stakerData[msg.sender];
        if (staker.stake == 0) {
          staker.stake = LPamount;
          staker.rewardsPerLPAtTimeStaked = state.rewardsAccumulatedPerLP;
        } else {
          uint256 LP1 = staker.stake + LPamount;
          uint256 RLP0_ = (LPamount * state.rewardsAccumulatedPerLP + staker.stake * staker.rewardsPerLPAtTimeStaked) / LP1;
          staker.stake = uint96(LP1);
          staker.rewardsPerLPAtTimeStaked = uint96(RLP0_);
        }
        stakerData[msg.sender] = staker;

        emit staked(msg.sender, LPamount);
        return true;
    }

    function unstake(uint96 LPamount)
        public
        returns(uint256 rewardCollected)
    {
        StakeData memory staker = stakerData[msg.sender];
        require(
          staker.stake >= LPamount,
          "DPL: Insufficient stake."
        );

        StakingState memory state = stakingState;
        if ((block.timestamp >= state.startTime) && (state.lastUpdate < 31536000)) {
            uint256 t1 = block.timestamp - state.startTime;       // calculate time relative to start time
            t1 = (t1 > 31536000) ? 31536000 : t1;                 // clamp at 1 year
            uint256 R1 = 170e24 * t1 / 31536000 - 85e24 * t1 * t1 / 994519296000000;
            uint256 R0 = 170e24 * state.lastUpdate / 31536000 - 85e24 * state.lastUpdate * state.lastUpdate / 994519296000000;
            state.rewardsAccumulatedPerLP += uint96(((R1 - R0) << 80) / state.totalStake);
            state.lastUpdate = uint32(t1);
        }
        state.totalStake -= LPamount;
        stakingState = state;

        uint256 rewards = ((state.rewardsAccumulatedPerLP - staker.rewardsPerLPAtTimeStaked) * staker.stake) >> 80;
        if (LPamount == staker.stake) delete stakerData[msg.sender];
        else {
          staker.stake -= LPamount;
          stakerData[msg.sender] = staker;
        }

        _mint(msg.sender, rewards);
        IERC20(indexToken).transfer(msg.sender, LPamount);
        emit unstaked(msg.sender, LPamount, rewards);
        return rewards;
    }

    function setMultisigAddress(address multisigAddress)
        external
        onlyOwner
        returns(bool success)
    {
        multisig = multisigAddress;
        return true;
    }

    function claimMultisigAllocation()
        external
        returns(uint256 amountReleased)
    {
        StakingState memory state = stakingState;
        require(block.timestamp > state.startTime, "Too early guys");

        uint256 t1 = block.timestamp - state.startTime;       // calculate time relative to start time
        t1 = (t1 > 31536000) ? 31536000 : t1;                 // clamp at 1 year
        uint256 R1 = 10e24 * t1 / 31536000 - 5e24 * t1 * t1 / 994519296000000;

        multisigAllocationClaimed = R1;
        amountReleased = R1 - multisigAllocationClaimed;
        _mint(multisig, amountReleased);
    }

    function claimFounderAllocation(uint256 amount, address destination)
        external
        returns(bool success)
    {
        require(msg.sender == founder, "Not yours man");
        StakingState memory state = stakingState;
        require(block.timestamp - state.startTime >= 31536000, "Too early man");

        uint256 availableAmount = 5e6 - founderAllocationClaimed;
        require(founderAllocationClaimed <= availableAmount, "Too much man");
        founderAllocationClaimed += amount;
        _mint(destination, amount);
        return true;
    }

}
