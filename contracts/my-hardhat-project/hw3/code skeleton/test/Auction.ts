import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("Auction", function () {
    async function deployAuctionContract() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const Auction = await ethers.getContractFactory("Auction");
        const contract = await Auction.deploy();

        return { contract, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should allow bids to be submitted", async function () {
            const { contract, owner, otherAccount } = await loadFixture(deployAuctionContract);

            const signers = await ethers.getSigners();

            let currHighestBid = 0;
            let currHighestBidder = undefined;
            for (let i = 0; i < signers.length; i++) {
                //Get random integer
                let bid = Math.floor(Math.random() * 100) + 1;
                if (bid > currHighestBid) {
                    currHighestBid = bid;
                    currHighestBidder = signers[i].address;
                }
                await contract.connect(signers[i]).submitBid(bid);
            }
        });

        it("Should allow bids and set winner correctly", async function () {
            const { contract, owner, otherAccount } = await loadFixture(deployAuctionContract);

            const signers = await ethers.getSigners();

            let currHighestBid = 0;
            let currHighestBidder = undefined;
            for (let i = 0; i < signers.length; i++) {
                //Get random integer
                let bid = Math.floor(Math.random() * 100) + 1;
                if (bid > currHighestBid) {
                    currHighestBid = bid;
                    currHighestBidder = signers[i].address;
                }
                await contract.connect(signers[i]).submitBid(bid);
            }

            // advance time by one hour and mine a new block
            await time.increase(3600 * 24 * 31);

            await contract.calculateWinner();
            expect(await contract.winningAddress()).to.equal(currHighestBidder);
        });

        it("Should ignore bids after AUCTION_DEADLINE", async function () {
            const { contract, owner, otherAccount } = await loadFixture(deployAuctionContract);

            const signers = await ethers.getSigners();

            let currHighestBid = 0;
            let currHighestBidder = undefined;
            for (let i = 1; i < signers.length; i++) {
                //Get random integer
                let bid = Math.floor(Math.random() * 100) + 1;
                if (bid > currHighestBid) {
                    currHighestBid = bid;
                    currHighestBidder = signers[i].address;
                }
                await contract.connect(signers[i]).submitBid(bid);
            }

            // advance time by one hour and mine a new block
            await time.increase(3600 * 24 * 31);

            await contract.connect(signers[0]).submitBid(10000).catch((err) => {
                // Ignore any error (revert, require, etc)
            });

            await contract.calculateWinner();
            expect(await contract.winningAddress()).to.equal(currHighestBidder);
        });

        it("Should disallow calculating winner before AUCTION_DEADLINE", async function () {
            const { contract, owner, otherAccount } = await loadFixture(deployAuctionContract);

            const signers = await ethers.getSigners();

            let currHighestBid = 0;
            let currHighestBidder = undefined;
            for (let i = 0; i < signers.length; i++) {
                //Get random integer
                let bid = Math.floor(Math.random() * 100) + 1;
                if (bid > currHighestBid) {
                    currHighestBid = bid;
                    currHighestBidder = signers[i].address;
                }
                await contract.connect(signers[i]).submitBid(bid);
            }

            await contract.calculateWinner().catch((err) => {
                // Ignore any error (revert, require, etc)
            });

            expect(await contract.winningAddress()).to.equal("0x0000000000000000000000000000000000000000");
        });
    });
});
