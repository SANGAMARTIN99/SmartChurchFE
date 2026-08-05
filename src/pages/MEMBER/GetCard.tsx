import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useTranslation, Trans } from 'react-i18next';
import { FaCreditCard, FaCheckCircle, FaExclamationCircle, FaSearch, FaArrowRight, FaArrowLeft, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// -- QUERIES --
const GET_ME = gql`
  query GetMe {
    me {
      id
      fullName
      street {
        id
        name
      }
    }
    myCardState {
        hasPendingApplication
        hasCurrentAssignment
    }
  }
`;

const GET_REGISTRATION_WINDOW = gql`
  query GetRegistrationWindow {
    registrationWindowStatus {
      isOpen
      startAt
      endAt
    }
  }
`;

const GET_NUMBER_SUGGESTIONS = gql`
  query GetNumberSuggestions($streetId: Int!, $queryNumber: Int!) {
    numberSuggestions(streetId: $streetId, queryNumber: $queryNumber) {
      street
      queryNumber
      exactAvailable
      exactCode
      suggestions {
        number
        code
      }
    }
  }
`;

const CREATE_CARD_APPLICATION = gql`
  mutation CreateCardApplication($input: CardApplicationInput!) {
    createCardApplication(input: $input) {
      ok
      application {
        id
        status
        assignment {
          id
          cardCode
        }
      }
    }
  }
`;

// -- COMPONENT --
const GetCard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState(1);
    const [pledges, setPledges] = useState({
        ahadi: '',
        shukrani: '',
        majengo: ''
    });
    const [cardNumber, setCardNumber] = useState('');
    const [note, setNote] = useState('');
    const [debouncedNumber, setDebouncedNumber] = useState<number | null>(null);

    // Queries
    const { data: meData, loading: meLoading } = useQuery(GET_ME);
    const { data: windowData } = useQuery(GET_REGISTRATION_WINDOW);

    // Dynamic Query
    const { data: suggestionData, loading: suggestionLoading } = useQuery(GET_NUMBER_SUGGESTIONS, {
        variables: {
            streetId: parseInt(meData?.me?.street?.id || '0'),
            queryNumber: debouncedNumber || 0
        },
        skip: !meData?.me?.street || !debouncedNumber
    });

    // Mutation
    const [createApp, { loading: submitting }] = useMutation(CREATE_CARD_APPLICATION, {
        onCompleted: (data) => {
            if (data.createCardApplication.ok) {
                const app = data.createCardApplication.application;
                toast.success(
                    app.status === 'APPROVED'
                        ? t('card_assigned_success', { code: app.assignment?.cardCode })
                        : t('app_submitted_pending')
                );
                navigate('/member-dashboard');
            }
        },
        onError: (err) => toast.error(err.message)
    });

    // Debounce Logic
    useEffect(() => {
        const handler = setTimeout(() => {
            const num = parseInt(cardNumber);
            if (!isNaN(num) && num > 0) setDebouncedNumber(num);
            else setDebouncedNumber(null);
        }, 500);
        return () => clearTimeout(handler);
    }, [cardNumber]);

    // Helpers
    const handlePledgeChange = (field: string, value: string) => setPledges(prev => ({ ...prev, [field]: value }));
    const handleSubmit = () => {
        if (!meData?.me?.street?.id) return toast.error(t('no_street_profile'));
        createApp({
            variables: {
                input: {
                    streetId: parseInt(meData.me.street.id),
                    preferredNumber: parseInt(cardNumber) || null,
                    pledgedAhadi: parseFloat(pledges.ahadi) || 0,
                    pledgedShukrani: parseFloat(pledges.shukrani) || 0,
                    pledgedMajengo: parseFloat(pledges.majengo) || 0,
                    note
                }
            }
        });
    };

    // Render Loading
    if (meLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="loader">{t('loading')}</div></div>;

    const isOpen = windowData?.registrationWindowStatus?.isOpen;
    const hasPending = meData?.myCardState?.hasPendingApplication;
    const hasCurrent = meData?.myCardState?.hasCurrentAssignment;

    // -- RENDER STATES --

    if (hasCurrent) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                    <div className="w-20 h-20 bg-[#E8FFD7] text-[#5E936C] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><FaCheckCircle /></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('all_set_title')}</h2>
                    <p className="text-gray-600 mb-6">{t('active_card_msg')}</p>
                    <button onClick={() => navigate('/member-dashboard')} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors">{t('go_to_dashboard')}</button>
                </motion.div>
            </div>
        );
    }

    if (hasPending) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                    <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><FaExclamationCircle /></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('app_pending_title')}</h2>
                    <p className="text-gray-600 mb-6">{t('app_pending_msg')}</p>
                    <button onClick={() => navigate('/member-dashboard')} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors">{t('return_home')}</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-screen-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{t('get_card_title')}</h1>
                    <p className="text-gray-500">{t('get_card_subtitle')}</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                    {/* Sidebar / Progress */}
                    <div className="bg-[#5E936C] text-white p-8 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <div className="text-xs uppercase tracking-widest opacity-75 mb-6">{t('progress_label')}</div>
                            <div className="space-y-6">
                                <div className={`flex items-center gap-4 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step > 1 ? 'bg-white text-[#5E936C] border-white' : 'border-white text-white'}`}>{step > 1 ? <FaCheckCircle /> : '1'}</div>
                                    <span className="font-semibold">{t('pledges_step')}</span>
                                </div>
                                <div className={`flex items-center gap-4 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step > 2 ? 'bg-white text-[#5E936C] border-white' : 'border-white text-white'}`}>2</div>
                                    <span className="font-semibold">{t('preferences_step')}</span>
                                </div>
                                <div className={`flex items-center gap-4 ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step > 3 ? 'bg-white text-[#5E936C] border-white' : 'border-white text-white'}`}>3</div>
                                    <span className="font-semibold">{t('review_step')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 mt-12 bg-[#4a7a58] bg-opacity-50 p-4 rounded-xl backdrop-blur-sm">
                            <p className="text-sm opacity-90 italic">{t('luke_verse')}</p>
                            <p className="text-xs mt-2 font-bold">{t('luke_ref')}</p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 md:w-2/3 flex flex-col">
                        <div className="flex-1">
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><FaMoneyBillWave className="text-[#5E936C]" /> {t('define_pledges_title')}</h2>
                                    <p className="text-gray-500">{t('define_pledges_subtitle')}</p>

                                    <div className="grid gap-6">
                                        {['Ahadi', 'Shukrani', 'Majengo'].map((type) => (
                                            <div key={type} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-[#5E936C] transition-colors">
                                                <label className="block text-sm font-bold text-gray-700 uppercase mb-2">{t(type.toLowerCase())}</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">TEx</span>
                                                    <input
                                                        type="number"
                                                        value={(pledges as any)[type.toLowerCase()]}
                                                        onChange={(e) => handlePledgeChange(type.toLowerCase(), e.target.value)}
                                                        className="w-full pl-14 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5E936C] outline-none transition-all text-lg font-mono"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><FaCreditCard className="text-blue-600" /> {t('choose_card_title')}</h2>
                                    <p className="text-gray-500">
                                        <Trans i18nKey="choose_card_subtitle" values={{ street: meData?.me?.street?.name }}>
                                            Your street is <strong>{meData?.me?.street?.name}</strong>. Enter your preferred number below.
                                        </Trans>
                                    </p>

                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">{t('preferred_number_label')}</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={cardNumber}
                                                onChange={e => setCardNumber(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                                placeholder="e.g. 50"
                                            />
                                            {suggestionLoading && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blue-500">{t('checking_status')}</span>}
                                        </div>
                                    </div>

                                    {/* Availability Feedback */}
                                    {debouncedNumber && suggestionData?.numberSuggestions && (
                                        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`p-4 rounded-xl border ${suggestionData.numberSuggestions.exactAvailable ? 'bg-[#E8FFD7] border-[#93DA97] text-[#5E936C]' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                            {suggestionData.numberSuggestions.exactAvailable ? (
                                                <div className="flex items-center gap-2 font-bold"><FaCheckCircle /> {t('available_excl')}</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 font-bold"><FaExclamationCircle /> {t('taken_reserved')}</div>
                                                    <div className="text-sm">{t('suggestions_label')}</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {suggestionData.numberSuggestions.suggestions.map((s: any) => (
                                                            <button key={s.number} onClick={() => setCardNumber(s.number.toString())} className="bg-white border px-3 py-1 rounded-full text-xs hover:bg-gray-50 transition shadow-sm text-gray-700">#{s.number}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">{t('additional_note_label')}</label>
                                        <textarea
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                            placeholder={t('note_placeholder')}
                                        ></textarea>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">{t('review_submit_title')}</h2>
                                    <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
                                        <div className="flex justify-between border-b border-gray-200 pb-2">
                                            <span className="text-gray-500">{t('applicant_label')}</span>
                                            <span className="font-semibold">{meData.me.fullName}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-200 pb-2">
                                            <span className="text-gray-500">{t('street_label')}</span>
                                            <span className="font-semibold">{meData.me.street.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-200 pb-2">
                                            <span className="text-gray-500">{t('requested_number_label')}</span>
                                            <span className="font-semibold">#{cardNumber || 'Any'}</span>
                                        </div>
                                        <div className="pt-2">
                                            <span className="text-gray-500 block mb-2">{t('total_pledges_label')}</span>
                                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                                <div className="bg-white p-2 rounded border">A: {Number(pledges.ahadi).toLocaleString()}</div>
                                                <div className="bg-white p-2 rounded border">S: {Number(pledges.shukrani).toLocaleString()}</div>
                                                <div className="bg-white p-2 rounded border">M: {Number(pledges.majengo).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="pt-8 border-t border-gray-100 flex justify-between mt-auto">
                            {step > 1 ? (
                                <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-gray-600 font-semibold hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <FaArrowLeft /> {t('back_button')}
                                </button>
                            ) : <div></div>}

                            {step < 3 ? (
                                <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 bg-[#5E936C] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#4a7a58] shadow-lg hover:shadow-xl transition-all">
                                    {t('next_step_button')} <FaArrowRight />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center gap-2 bg-[#5E936C] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#4a7a58] shadow-lg hover:shadow-xl transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                    {submitting ? t('submitting_btn') : t('confirm_application')} <FaCheckCircle />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GetCard;

// Revision note [2026-07-18 18:34:33 +0300]: Refactor card application status badges

// Revision note [2026-08-02 09:43:25 +0300]: Enhance form input validation and feedback

// Activity update [2026-07-16 15:40:53 +0300]: Refactor card application status badges

// Activity update [2026-07-26 18:41:41 +0300]: Update dropdown selector options and hints

// Activity update [2026-08-05 20:51:11 +0300]: Update i18n translations and labels
