import { ethers } from 'ethers';
import RaffleAbi from './abi/Raffle.json' assert { type: 'json' };
import dotenv from 'dotenv';

dotenv.config();

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
export const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_PROVIDER_SEPOLIA);
export const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
export const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, RaffleAbi, wallet);