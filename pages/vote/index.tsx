import React, { useState, useEffect, useRef } from 'react'
import Breatcome from '@/component/Breatcome/Breatcome';
import { useWallet } from '../../utils/useWallet';
import moment from 'moment';
import BigNumber from "bignumber.js";
import CurrencyFormat from 'react-currency-format';
import dynamic from 'next/dynamic';
import { EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify';
import Chart from 'chart.js/auto';

import * as WEB3API from '../../utils/web3api';
import * as API from '../../utils/api';
import { signAuthPayload } from '../../utils/signRequest';
import { sanitizeHtml } from '../../utils/sanitize';
import { sameAddress } from '../../utils/helpers';
import { votePercents as voteSharePercents } from '../../utils/voteMath';
import type { ProposalView } from '../../types/proposal';

import Escrowaccount from '@/component/Homepage/Escrowaccount/Escrowaccount'

import ReactModal from "react-modal";
ReactModal.setAppElement("#__next");

const Editor = dynamic(
    () => import('react-draft-wysiwyg').then((mod) => mod.Editor as React.ComponentType<any>),
    { ssr: false },
);
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const VotePage = () => {
    const { account, library } = useWallet();

    const [hodlBalance, setHODLBalance] = useState(0)
    const [ftoBalance, setFTOBalance] = useState(0)
    const [voteCount, setVoteCount] = useState(0);
    const [ableToProposal, setAbleToProposal] = useState(false)
    const [ableToVote, setAbleToVote] = useState(false)

    const [loading, setLoading] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [daoOwner, setDaoOwner] = useState('');

    const [tab, setTab] = useState('live')

    const [liveProposals, setLiveProposals] = useState<ProposalView[]>([]);
    const [pendingProposals, setPendingProposals] = useState<ProposalView[]>([]);
    const [pastProposals, setPastProposals] = useState<ProposalView[]>([]);
    const [proposal, setProposal] = useState<ProposalView | null>(null);

    const [totalProposals, setTotalProposals] = useState(0);

    const [editorState, setEditorState] = useState(() =>
        EditorState.createEmpty()
    );
    const [proposalDescription, setProposalDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [visibleCreateProposalModal, setVisibleCreateProposalModal] = useState(false)
    const [visibleProposalModal, setVisibleProposalModal] = useState(false)

    const voteChartRef = useRef(null);
    const voteChartInstance = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    useEffect(() => {
        loadProposals()
    }, []);

    useEffect(() => {
        if (account) {
            getHODLBalance();
            getFTOBalance();
            getVoteCount();
            getAbleToProposal();
            getAbleToVote();
            loadDaoOwner();
        }
    }, [account])

    useEffect(() => {
        const rawContentState = convertToRaw(editorState.getCurrentContent());
        const markup = draftToHtml(rawContentState);
        setProposalDescription(sanitizeHtml(markup));
    }, [editorState]);

    const notifyError = (message) => toast(message, { hideProgressBar: true, autoClose: 3000, type: 'error', position:'top-right' })
    const notifySuccess = (message) => toast(message, { hideProgressBar: true, autoClose: 3000, type: 'success', position:'top-right' })

    const getHODLBalance = async () => {
        try {
            const balance = await WEB3API.getHODLBalance(account, library)
            if (balance != null) {
                setHODLBalance(balance);
            }
        } catch(err) {
            notifyError(err.message)
        }
    }

    const getFTOBalance = async () => {
        try {
            const balance = await WEB3API.getFTOBalance(account, library)
            if (balance != null) {
                setFTOBalance(balance);
            }
        } catch(err) {
            notifyError(err.message)
        }
    }

    const getVoteCount = async () => {
        try {
            const count = await WEB3API.getVoteCount(account, library)
            if (count != null) {
                setVoteCount(count);
            }
        } catch(err) {
            notifyError(err.message)
        }
    }

    const getAbleToProposal = async () => {
        try {
            setAbleToProposal(Boolean(await WEB3API.getAbleToProposal(account, library)));
        } catch(err) {
            notifyError(err.message)
        }
    }

    const getAbleToVote = async () => {
        try {
            setAbleToVote(Boolean(await WEB3API.getAbleToVote(account, library)));
        } catch(err) {
            notifyError(err.message)
        }
    }

    const loadDaoOwner = async () => {
        try {
            const ownerAddress = await WEB3API.owner(library);
            if (ownerAddress) {
                setDaoOwner(ownerAddress);
            }
        } catch (err) {
            notifyError(err.message);
        }
    }

    const loadProposals = () => {
        loadLiveProposals();
        loadPendingProposals();
        loadPastProposals();
    }

    const loadLiveProposals = async () => {
        try {
            setLoading(true);
            const response = await API.getLiveProposals();
            if (response.data.result == 'success') {
                setLiveProposals(response.data.data.docs);
            }
            setLoading(false);
        } catch(err) {
            setLoading(false);
            notifyError(err.message)
        }
    }

    const loadPendingProposals = async () => {
        try {
            setLoading(true);
            const response = await API.getPendingProposals();
            if (response.data.result == 'success') {
                setPendingProposals(response.data.data.docs);
            }
            setLoading(false);
        } catch(err) {
            setLoading(false);
            notifyError(err.message)
        }
    }

    const loadPastProposals = async () => {
        try {
            setLoading(true);
            const response = await API.getPastProposals();
            if (response.data.result == 'success') {
                setPastProposals(response.data.data.docs);
                setTotalProposals(response.data.data.totalDocs);
            }
            setLoading(false);
        } catch(err) {
            setLoading(false);
            notifyError(err.message)
        }
    }

    const openCreateProposalModal = () => {
        setVisibleCreateProposalModal(true)
    }

    const closeCreateProposalModal = () => {
        setVisibleCreateProposalModal(false)
    }

    const onSubmit = async (data) => {
        try {
            setIsSubmitting(true)
            if (data.file && data.file.length > 0) {
                const auth = await signAuthPayload(library, account, 'attachfile');
                const fileresult = await API.attachFileProposal(data, auth)
                data.attachment = fileresult.data.data.path
            }

            data.proposer = account
            data.description = proposalDescription
            const createAuth = await signAuthPayload(library, account, 'create');
            const response = await API.createProposal({ ...data, ...createAuth })
            const created = response.data.proposal;

            const result = await WEB3API.createProposal({
                account,
                id: created._id,
                start: created.start_at,
                end: created.end_at,
                receiver: created.receiver,
                amount: created.amount
            }, library);

            const returnValues = result?.events?.CreatedProposal?.returnValues;
            if (returnValues) {
                const syncAuth = await signAuthPayload(library, account, 'sync', created._id);
                await API.syncProposal({
                    ...returnValues,
                    id: created._id,
                    ...syncAuth,
                })
            }
            closeCreateProposalModal()
            notifySuccess('Proposal submitted on-chain')
            loadProposals()
            setIsSubmitting(false)
        } catch(err) {
            console.log(err)
            notifyError(err.message)
            setIsSubmitting(false)
        }
    }

    const showProposal = (data) => {
        setProposal(data)
        setVisibleProposalModal(true)
        setTimeout(() => {
            showVoteChart(data)
        }, 1000)
    }

    const showVoteChart = async (data) => {
        const shares = voteSharePercents(data.votes_yes, data.votes_no);

        if (voteChartInstance.current) {
            voteChartInstance.current.destroy();
        }
        if (!voteChartRef.current) return;

        voteChartInstance.current = new Chart(voteChartRef.current, {
            type: "doughnut",
            data: {
                labels: ["Approved", "Denied"],
                datasets: [{
                    backgroundColor: ["#4DB866", "#EDB019"],
                    data: [shares.yes, shares.no]
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: data.title
                    },
                },
            }
        });
    }

    const closeProposalModal = () => {
        setVisibleProposalModal(false)
    }

    const isProposalLive = (item) => {
        if (!item) return false;
        const now = Math.floor(Date.now() / 1000);
        return Boolean(item.token_id) && !item.canceled && item.start_at < now && item.end_at > now;
    }

    const canCancelProposal = (item) => {
        if (!item || !account || item.canceled) return false;
        if (!sameAddress(account, item.proposer)) return false;
        const now = Math.floor(Date.now() / 1000);
        return !item.end_at || item.end_at > now;
    }

    const canExecuteProposal = (item) => {
        if (!item || !account || item.canceled) return false;
        if (!sameAddress(account, daoOwner)) return false;
        if (!item.token_id || !item.approved) return false;
        const now = Math.floor(Date.now() / 1000);
        return Number(item.end_at) <= now;
    }

    const executeOnProposal = async (item) => {
        try {
            if (!canExecuteProposal(item)) {
                notifyError('Only the DAO owner can execute an approved past proposal.');
                return;
            }
            setIsExecuting(true);
            await WEB3API.exeProposal({
                account,
                token_id: item.token_id,
            }, library);
            notifySuccess('Proposal executed on-chain');
            closeProposalModal();
            loadProposals();
            setIsExecuting(false);
        } catch (err) {
            setIsExecuting(false);
            notifyError(err.message);
        }
    }

    const cancelOnProposal = async (item) => {
        try {
            if (!canCancelProposal(item)) {
                notifyError('You cannot cancel this proposal.');
                return;
            }

            setIsCanceling(true);
            if (item.token_id != null) {
                await WEB3API.closeProposal({
                    account,
                    token_id: item.token_id,
                }, library);
            }

            const auth = await signAuthPayload(library, account, 'cancel', String(item._id));
            await API.cancelProposal(item._id, auth);
            notifySuccess('Proposal canceled');
            closeProposalModal();
            loadProposals();
            setIsCanceling(false);
        } catch (err) {
            setIsCanceling(false);
            notifyError(err.message);
        }
    }

    const voteOnProposal = async (item, yes) => {
        try {
            if (!ableToVote) {
                notifyError('You are not eligible to vote.');
                return;
            }
            if (!isProposalLive(item)) {
                notifyError('This proposal is not live.');
                return;
            }

            setIsVoting(true);
            await WEB3API.vote({
                account,
                token_id: item.token_id,
                yes,
            }, library);

            const auth = await signAuthPayload(library, account, 'vote', String(item._id));
            const recorded = await API.recordVote({
                id: item._id,
                ...auth,
            });

            const updated = recorded?.data?.proposal || item;
            setProposal(updated);
            showVoteChart(updated);
            loadProposals();
            notifySuccess(yes ? 'Approved on-chain' : 'Denied on-chain');
            setIsVoting(false);
        } catch (err) {
            setIsVoting(false);
            notifyError(err.message);
        }
    }

    const approve = async (item) => {
        await voteOnProposal(item || proposal, true);
    }

    const deny = async (item) => {
        await voteOnProposal(item || proposal, false);
    }

    const votePercents = () => voteSharePercents(proposal?.votes_yes, proposal?.votes_no);

    const renderProposalList = (items) => {
        if (!items || items.length === 0) {
            return (
                <li>
                    <h6 className="py-3">{loading ? 'Loading...' : 'No proposal'}</h6>
                </li>
            );
        }

        return items.map((item) => (
            <li
                className="proposal-item"
                key={`proposal-${item._id}`}
                onClick={() => showProposal(item)}
            >
                <h5 className="proposal-title">{item.title}</h5>
                <div className="proposal-desc" dangerouslySetInnerHTML={{__html: sanitizeHtml(item.description)}}></div>
            </li>
        ));
    }

    const percents = votePercents();

    return (
        <>
            <Breatcome pageName='Vote' />
            <Escrowaccount />
            {
                account ? (
                    <div className="contact-section style-two pt-100 pb-100">
                        <div className="container">
                            <div className="row mb-4">
                                <div className="col-lg-12">
                                    <div className="dreamit-section-title two text-center pb-20">
                                        <div className="dreamit-section-main-title">
                                            <h1>Vote</h1>
                                        </div>
                                        <div className="dreamit-section-content-text">
                                            <p>Participate in the FolioDAO economy to support the growth of the fungible token and input of assets.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-lg-7 col-md-12">
                                    <div className="right-side-info">
                                        <div className="dreamit-section-sub-title">
                                            <h5>Proposals {totalProposals ? `(${totalProposals} past)` : ''}</h5>
                                        </div>
                                        <div className="single-conpany-info-box ">
                                            <div className="row pt-25">
                                                <div className="col-lg-12">
                                                    <div className="tab-content text-center">
                                                        <ul className="tabs">
                                                            <li className={`${tab === "live" ? "active" : ''}`} rel="tab1" onClick={() => setTab("live")} >Live </li>
                                                            <li className={`${tab === "pending" ? "active" : ''}`} rel="tab2" onClick={() => setTab("pending")}>Pending </li>
                                                            <li className={`${tab === "past" ? "active" : ''}`} rel="tab3" onClick={() => setTab("past")}>Past</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="tab_container">
                                                <div id="tab1" style={{ display: tab === `live` ? `block` : 'none' }} className="tab_content">
                                                    <ul className="proposal-list">
                                                        {renderProposalList(liveProposals)}
                                                    </ul>
                                                </div>
                                                <div id="tab2" style={{ display: tab === `pending` ? `block` : 'none' }} className="tab_content">
                                                    <ul className="proposal-list">
                                                        {renderProposalList(pendingProposals)}
                                                    </ul>
                                                </div>
                                                <div id="tab3" style={{ display: tab === `past` ? `block` : 'none' }} className="tab_content">
                                                    <ul className="proposal-list">
                                                        {renderProposalList(pastProposals)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-5 col-md-12">
                                    <div className="contact_from upper10">
                                        <div className="single-info-box d-flex">
                                            <div className="info-content">
                                                <h4>FOLIO Token Owned</h4>
                                                <p><CurrencyFormat value={BigNumber(hodlBalance || 0).toFixed(2).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FOLIO </p>
                                            </div>
                                        </div>
                                        <div className="single-info-box d-flex">
                                            <div className="info-content">
                                                <h4>FTO Token Owned</h4>
                                                <p><CurrencyFormat value={BigNumber(ftoBalance || 0).toFixed(2).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> FTO </p>
                                            </div>
                                        </div>
                                        <div className="single-info-box d-flex">
                                            <div className="info-content">
                                                <h4>Amount of Votes</h4>
                                                <p><CurrencyFormat value={BigNumber(voteCount || 0).toFixed(0).toString()} displayType={'text'} thousandSeparator={true} prefix={''} /> Votes</p>
                                            </div>
                                        </div>
                                        <div className="single-info-box d-flex">
                                            <div className="info-content">
                                                <h4>Able to create proposal</h4>
                                                <p>{ ableToProposal ? 'Yes' : 'No' }</p>
                                            </div>
                                        </div>
                                        <div className="single-info-box d-flex">
                                            <div className="info-content">
                                                <h4>Able to vote</h4>
                                                <p>{ ableToVote ? 'Yes' : 'No' }</p>
                                            </div>
                                        </div>
                                        {
                                            ableToProposal && (
                                                <div className="text-center mt-4">
                                                    <button className="btn btn-primary" type="button" onClick={openCreateProposalModal}>New Proposal</button>
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="why-choose-section pt-90 pb-80">
                        <div className="dreamit-section-title-two text-center pb-20">
                            <div className="dreamit-section-main-title">
                                <h3>Connect your wallet</h3>
                            </div>
                        </div>
                    </div>
                )
            }
            <ReactModal
                isOpen={visibleProposalModal}
                onRequestClose={closeProposalModal}
                contentLabel="Proposal"
                className="custom-modal"
                overlayClassName="custom-overlay"
                closeTimeoutMS={500}
            >
                <>
                    <button className="close-modal" onClick={closeProposalModal}>
                        <img src="/assets/images/cancel.svg" alt="close icon" />
                    </button>
                    <div className="box_inner">
                        <div className="scrollable">
                        {
                            proposal && (
                                <>
                                    <div className="modal-title">
                                        <h5>{proposal.title}</h5>
                                    </div>
                                    <div className="proposal-time text-secondary">
                                        <span className="theme-bg">{moment.unix(proposal.start_at).format("MMM D, YYYY HH:mm")} - {moment.unix(proposal.end_at).format("MMM D, YYYY HH:mm")}</span>
                                    </div>
                                    <div className="text-secondary">
                                        <span>Amount: {proposal.amount}</span>
                                    </div>
                                    <div className="text-secondary">
                                        <span>Proposer: {proposal.proposer}</span>
                                    </div>
                                    <div className="text-secondary">
                                        <span>Receiver: {proposal.receiver}</span>
                                    </div>
                                    <div className="proposal-content my-4">
                                        <div className="proposal-desc" dangerouslySetInnerHTML={{__html: sanitizeHtml(proposal.description)}}></div>
                                        {
                                            proposal.attachment && String(proposal.attachment).startsWith('/uploads/') && (
                                                <div className="proposal-attachment mt-4">
                                                    <a href={proposal.attachment} target="_blank" rel="noreferrer"><i className="fas fa-paperclip"></i> Download attachment</a>
                                                </div>
                                            )
                                        }
                                    </div>
                                    <div className="proposal-votes-chart row">
                                        <div className="col-sm-6">
                                            <canvas ref={voteChartRef} id="voteChart" width="500" height="500"></canvas>
                                        </div>
                                        <div className="col-sm-6">
                                            <div className="chart-menu">
                                                <ul>
                                                    <li className="another1"> <span>{percents.yes}%</span> Approved</li>
                                                    <li className="another2"> <span>{percents.no}%</span> Denied</li>
                                                </ul>
                                            </div>
                                            {
                                                isProposalLive(proposal) && ableToVote && (
                                                    <div className="d-flex">
                                                        <button className="btn btn-success" disabled={isVoting || isCanceling} onClick={() => approve(proposal)}>Approve</button>
                                                        <button className="btn btn-warning ml-4" disabled={isVoting || isCanceling} onClick={() => deny(proposal)}>Deny</button>
                                                    </div>
                                                )
                                            }
                                            {
                                                canCancelProposal(proposal) && (
                                                    <div className="mt-3">
                                                        <button className="btn btn-danger" disabled={isVoting || isCanceling || isExecuting} onClick={() => cancelOnProposal(proposal)}>Cancel proposal</button>
                                                    </div>
                                                )
                                            }
                                            {
                                                canExecuteProposal(proposal) && (
                                                    <div className="mt-3">
                                                        <button className="btn btn-primary" disabled={isVoting || isCanceling || isExecuting} onClick={() => executeOnProposal(proposal)}>Execute payout</button>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                </>
                            )
                        }
                        </div>
                    </div>
                </>
            </ReactModal>
            <ReactModal
                isOpen={visibleCreateProposalModal}
                onRequestClose={closeCreateProposalModal}
                contentLabel="New Proposal"
                className="custom-modal"
                overlayClassName="custom-overlay"
                closeTimeoutMS={500}
            >
                <>
                    <button className="close-modal" onClick={closeCreateProposalModal}>
                        <img src="/assets/images/cancel.svg" alt="close icon" />
                    </button>
                    <div className="box_inner">
                        <div className="scrollable">
                            <div className="modal-title">
                                <h5>New Proposal</h5>
                            </div>
                            <div className="proposal_form mt-3">
                                <form action="#" method="POST" id="dreamit-form" onSubmit={handleSubmit(onSubmit)}>
                                    <div className="row">
                                        <div className="col-lg-12">
                                            <div className="form_box mb-3">
                                                <label>Subject</label>
                                                <input
                                                    className="form-control"
                                                    type="text"
                                                    name="title"
                                                    {...register('title', { required: true })}
                                                />
                                                {errors.title && <small className="text-danger">Subject is required</small>}
                                            </div>
                                        </div>
                                        <div className="col-lg-12">
                                            <div className="form_box mb-3">
                                                <label>Description</label>
                                                <div className="border">
                                                    <Editor
                                                        editorState={editorState}
                                                        onEditorStateChange={setEditorState}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form_box mb-3">
                                                <label>Attachment</label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    name="file"
                                                    {...register('file')}
                                                />
                                            </div>
                                            <div className="form_box mb-3">
                                                <label>Recipient Address</label>
                                                <input
                                                    className="form-control"
                                                    name="receiver"
                                                    {...register('receiver', { required: true })}
                                                />
                                                {errors.receiver && <small className="text-danger">Recipient is required</small>}
                                            </div>
                                            <div className="form_box mb-3">
                                                <label>Amount</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="amount"
                                                    {...register('amount', { required: true })}
                                                />
                                                {errors.amount && <small className="text-danger">Amount is required</small>}
                                            </div>
                                            <div className="form_box mb-3">
                                                <label>Period</label>
                                                <select
                                                    className="form-control"
                                                    name="period"
                                                    defaultValue="24"
                                                    {...register('period', { required: true })}
                                                >
                                                    <option value="10">10 Minutes</option>
                                                    <option value="24">24 Hours</option>
                                                    <option value="48">48 Hours</option>
                                                    <option value="72">72 Hours</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-lg-12 quote_btn text-center mt-4">
                                            <button className="btn btn-primary" type="submit" disabled={isSubmitting}> Send Now </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            </ReactModal>
        </>
    )
}

export default VotePage;
