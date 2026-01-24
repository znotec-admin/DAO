import React, { useState, useEffect } from 'react'
import CurrencyFormat from 'react-currency-format';
import BigNumber from "bignumber.js";
import { toast } from 'react-toastify';

import { useWallet } from '../../utils/useWallet';
import * as WEB3API from '../../utils/web3api';
import Breatcome from '@/component/Breatcome/Breatcome';

const hasShares = (value) => {
    try {
        return new BigNumber(String(value || 0)).gt(0);
    } catch (_error) {
        return false;
    }
};

const RewardPage = () => {
    const { account, library } = useWallet();

    const [isFounder, setIsFounder] = useState(false);
    const [totalFounder, setTotalFounder] = useState(0);
    const [releasableFounder, setReleasableFounder] = useState(0);
    const [isTeamMember, setIsTeamMember] = useState(false);
    const [totalTeamMember, setTotalTeamMember] = useState(0);
    const [releasableTeamMember, setReleasableTeamMember] = useState(0);
    const [isEquityPartner, setIssEquityPartner] = useState(false);
    const [totalEquityPartner, setTotalEquityPartner] = useState(0);
    const [releasableEquityPartner, setReleasableEquityPartner] = useState(0);
    const [isCtoHolder, setIsCtoHolder] = useState(false);
    const [rewardCTO, setRewardCTO] = useState(0);

    useEffect(() => {
        if (!account) {
            setIsFounder(false);
            setIsTeamMember(false);
            setIssEquityPartner(false);
            setIsCtoHolder(false);
            return;
        }

        const loadRoles = async () => {
            const [founderShares, teamShares, equityShares, ctoShares] = await Promise.all([
                WEB3API.getFounderShares(account, library),
                WEB3API.getTeamMemberShares(account, library),
                WEB3API.getEquityPartnerShares(account, library),
                WEB3API.getCtoShares(account, library),
            ]);
            setIsFounder(hasShares(founderShares));
            setIsTeamMember(hasShares(teamShares));
            setIssEquityPartner(hasShares(equityShares));
            setIsCtoHolder(hasShares(ctoShares));
        };

        loadRoles();
        getFounderTotal();
        getTeamMemberTotal();
        getEquityPartnerTotal();
    }, [account, library])

    useEffect(() => {
        if (!account) return;
        if (isFounder) {
            getFounderReleasable(account)
        }
        if (isTeamMember) {
            getTeamMemberReleasable(account)
        }
        if (isEquityPartner) {
            getEquityPartnerReleasable(account)
        }
        if (isCtoHolder) {
            getRewardCTO(account)
        } else {
            setRewardCTO(0)
        }
    }, [account, isFounder, isTeamMember, isEquityPartner, isCtoHolder])

    const notifyError = (message) => toast(message, { hideProgressBar: false, autoClose: 3000, type: 'error' ,position:'top-right' })

    const getFounderTotal = async () => {
        let amount = await WEB3API.getFounderTotal(library)
        setTotalFounder(amount)
    }

    const getFounderReleasable = async (account) => {
        let amount = await WEB3API.getFounderReleasable(account, library)
        setReleasableFounder(amount)
    }

    const releaseFounder = async () => {
        try {
            await WEB3API.releaseFounder(account, library)
        } catch (err) {
            notifyError(err.message)
        }
    }

    const getTeamMemberTotal = async () => {
        let amount = await WEB3API.getTeamMemberTotal(library)
        setTotalTeamMember(amount)
    }

    const getTeamMemberReleasable = async (account) => {
        let amount = await WEB3API.getTeamMemberReleasable(account, library)
        setReleasableTeamMember(amount)
    }

    const releaseTeamMember = async () => {
        try {
            await WEB3API.releaseTeamMember(account, library)
        } catch (err) {
            notifyError(err.message)
        }
    }

    const getEquityPartnerTotal = async () => {
        let amount = await WEB3API.getEquityPartnerTotal(library)
        setTotalEquityPartner(amount)
    }

    const getEquityPartnerReleasable = async (account) => {
        let amount = await WEB3API.getEquityPartnerReleasable(account, library)
        setReleasableEquityPartner(amount)
    }
    
    const releaseEquityPartner = async () => {
        try {
            await WEB3API.releaseEquityPartner(account, library)
        } catch (err) {
            notifyError(err.message)
        }
    }

    const getRewardCTO = async (account) => {
        let amount = await WEB3API.getRewardCTO(account, library)
        setRewardCTO(amount)
    }
    
    const releaseCTOReward = async () => {
        try {
            await WEB3API.releaseRewardCTO(account, library)
        } catch (err) {
            notifyError(err.message)
        }
    }    

    return (
        <>
            <Breatcome pageName='Reward' />
            {
                account ? (
                    <>
                        {
                            isFounder || isTeamMember || isEquityPartner ? (
                                <div className="why-choose-section pt-90 pb-80">
                                    <div className="container">
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="dreamit-section-title-two text-center pb-20">
                                                    <div className="dreamit-section-main-title">
                                                        <h1>Release your <span>shares</span></h1>
                                                    </div>
                                                    <div className="dreamit-section-content-text-inner">
                                                        <p>If you are a founder, team member or equity partner, you can release your shares</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row pt-30">
                                            {
                                                isFounder ? (
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="single-why-choose-box">
                                                            <div className="why-choose-thumb">
                                                                <img src="assets/images/choose/choose.png" alt="" />
                                                            </div>
                                                            <div className="why-choose-content">
                                                                <h2>Founder share</h2>
                                                                <p>Total amount: </p>
                                                                <p><strong>
                                                                    <CurrencyFormat value={BigNumber(totalFounder).toFixed(4).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FOLIO
                                                                </strong></p>
                                                                <p>Releasable amount: </p>
                                                                <p><strong>
                                                                    <CurrencyFormat value={BigNumber(releasableFounder).toFixed(4).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FOLIO
                                                                </strong></p>
                                                                {new BigNumber(String(releasableFounder || 0)).gt(0) ? (
                                                                    <div className="release-button wow fadeInUp" data-wow-delay=".8s">
                                                                        <button onClick={() => releaseFounder()}>Release</button>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    ''
                                                )
                                            }
                                            {
                                                isTeamMember ? (
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="single-why-choose-box">
                                                            <div className="why-choose-thumb">
                                                                <img src="assets/images/choose/choose2.png" alt="" />
                                                            </div>
                                                            <div className="why-choose-content two">
                                                                <h2>Team member share</h2>
                                                                <p>Total amount: </p>
                                                                <p><strong>
                                                                    <CurrencyFormat value={BigNumber(totalTeamMember).toFixed(4).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FOLIO
                                                                </strong></p>
                                                                <p>Releasable amount: </p>
                                                                <p><strong>
                                                                    <CurrencyFormat value={BigNumber(releasableTeamMember).toFixed(4).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FOLIO
                                                                </strong></p>
                                                                {new BigNumber(String(releasableTeamMember || 0)).gt(0) ? (
                                                                    <div className="release-button wow fadeInUp" data-wow-delay=".8s">
                                                                        <button onClick={() => releaseTeamMember()}>Release</button>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    ''
                                                )
                                            }
                                            {
                                                isEquityPartner ? (
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="single-why-choose-box">
                                                            <div className="why-choose-thumb">
                                                                <img src="assets/images/choose/choose3.png" alt="" />
                                                            </div>
                                                            <div className="why-choose-content three">
                                                                <h2>Equity partner share</h2>
                                                                <p>Total amount: </p>
                                                                <p><strong>
                                                                    <CurrencyFormat value={BigNumber(totalEquityPartner).toFixed(4).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FOLIO
                                                                </strong></p>
                                                                <p>Releasable amount: </p>
                                                                <p><strong>
                                                                    <CurrencyFormat value={BigNumber(releasableEquityPartner).toFixed(4).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FOLIO
                                                                </strong></p>
                                                                {new BigNumber(String(releasableEquityPartner || 0)).gt(0) ? (
                                                                    <div className="release-button wow fadeInUp" data-wow-delay=".8s">
                                                                        <button onClick={() => releaseEquityPartner()}>Release</button>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    ''
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                ''
                            )
                        }
                        <div className="choose-section pt-100 pb-70">
                            <div className="container">
                                <div className="row">
                                    <div className="col-lg-12">
                                        <div className="dreamit-section-title  pb-20">
                                            <div className="dreamit-section-sub-title">
                                                <h5>Your reward for NFT</h5>
                                            </div>
                                            <div className="dreamit-section-main-title">
                                                <h1>Release your reward if you are a NFT holder.</h1>
                                            </div>                                            
                                        </div>
                                    </div>
                                </div>
                                <div className="row pt-25">
                                    {isCtoHolder ? (
                                    <div className="col-lg-4 col-md-6">
                                        <div className="choose-single-box">
                                            <div className="choose-thumb">
                                                <img src="assets/images/choose/one.png" alt="" />
                                            </div>
                                            <div className="choose-content">
                                                <h2>CTO Reward</h2>
                                                <p>You can use mobile device to pay with simple steps in value. compellingly</p>
                                                <p><strong>
                                                    <CurrencyFormat value={BigNumber(rewardCTO).toFixed(4).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FOLIO
                                                </strong></p>
                                                {new BigNumber(String(rewardCTO || 0)).gt(0) ? (
                                                    <div className="release-button wow fadeInUp" data-wow-delay=".8s">
                                                        <button onClick={() => releaseCTOReward()}>Release</button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    ) : !isFounder && !isTeamMember && !isEquityPartner ? (
                                        <div className="col-lg-12">
                                            <p className="text-center">No on-chain splitter shares found for this wallet.</p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="why-choose-section pt-90 pb-80">
                        <div className="dreamit-section-title-two text-center pb-20">
                            <div className="dreamit-section-main-title">
                                <h1>Connect your wallet first</h1>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
}

export default RewardPage;
