import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaTransgender, FaCamera, FaSave, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ME_QUERY } from '../api/queries';
import { UPDATE_USER_PROFILE } from '../api/mutations';
import { ENDPOINT } from '../api/environment';
import { getAccessToken } from '../utils/auth';

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { data, loading, error, refetch } = useQuery(ME_QUERY);
    const [updateProfile, { loading: updating }] = useMutation(UPDATE_USER_PROFILE);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        bio: '',
    });

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (data?.me) {
            setFormData({
                fullName: data.me.fullName || '',
                email: data.me.email || '',
                phoneNumber: data.me.phoneNumber || '',
                dateOfBirth: data.me.dateOfBirth || '', // Assuming this might be added later
                gender: data.me.gender || '', // Assuming this might be added later
                bio: data.me.bio || '', // Assuming this might be added later
            });
        }
    }, [data]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({
                variables: {
                    ...formData
                }
            });
            toast.success(t('profile_updated_success'));
            refetch();
        } catch (err) {
            console.error(err);
            toast.error(t('profile_update_failed'));
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type/size
        if (!file.type.startsWith('image/')) {
            toast.error(t('upload_image_error'));
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error(t('file_size_error'));
            return;
        }

        setUploadingPhoto(true);

        // Construct Upload URL
        // Assume base URL is ENDPOINT minus /graphql/
        const baseUrl = ENDPOINT.replace('/graphql/', '');
        const uploadUrl = `${baseUrl}/api/users/profile-photo/`; // Adjust based on actual backend route

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                },
                body: formData,
            });

            if (response.ok) {
                toast.success(t('photo_updated_success'));
                refetch(); // Reload user data to get new photo URL
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            console.error(err);
            toast.error(t('photo_upload_failed'));
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-[#F7FCF5]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E936C]"></div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center min-h-screen bg-[#F7FCF5] text-red-600">
            {t('profile_load_error')}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F7FCF5] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 relative"
                >
                    {/* Cover Image */}
                    <div className="h-48 bg-gradient-to-r from-[#5E936C] to-[#93DA97] relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    {/* Profile Content */}
                    <div className="px-8 pb-8">
                        <div className="relative -mt-20 mb-4 flex flex-col md:flex-row items-center md:items-end">
                            {/* Profile Photo */}
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                                    {data?.me?.profilePhoto ? (
                                        <img
                                            src={data.me.profilePhoto}
                                            alt={data.me.fullName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#E8FFD7] text-[#5E936C]">
                                            <FaUser className="text-6xl" />
                                        </div>
                                    )}
                                    {/* Upload Overlay */}
                                    <div
                                        onClick={handlePhotoClick}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        {uploadingPhoto ? (
                                            <FaSpinner className="animate-spin text-white text-2xl" />
                                        ) : (
                                            <FaCamera className="text-white text-2xl" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                </div>
                            </div>

                            {/* Name and Role */}
                            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
                                <h1 className="text-3xl font-bold text-gray-800">{data.me.fullName}</h1>
                                <p className="text-[#5E936C] font-semibold flex items-center justify-center md:justify-start gap-2">
                                    <span className="px-3 py-1 bg-[#E8FFD7] rounded-full text-sm">
                                        {data.me.role?.replace('_', ' ')}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Form Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* Left Column: Quick Info */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaInfoCircle className="text-[#5E936C]" /> {t('account_info')}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('member_since')}</label>
                                    <p className="font-medium text-gray-700">January 2024</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('status')}</label>
                                    <p className="font-medium text-green-600 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> {t('active')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">{t('group')}</label>
                                    <p className="font-medium text-gray-700">
                                        {data.me.groups?.map((g: any) => g.name).join(', ') || t('no_group')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Edit Form */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-800">{t('personal_details')}</h2>
                                <button
                                    onClick={handleSubmit}
                                    disabled={updating}
                                    className="bg-[#5E936C] text-white px-6 py-2 rounded-xl hover:bg-[#4a7a58] transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
                                >
                                    {updating ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {t('save_changes')}
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('full_name')}</label>
                                        <div className="relative">
                                            <FaUser className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C] focus:border-transparent outline-none transition-all"
                                                placeholder={t('full_name_placeholder')}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('email_address')}</label>
                                        <div className="relative">
                                            <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C] focus:border-transparent outline-none transition-all bg-gray-50"
                                                placeholder={t('email_placeholder')}
                                                readOnly // Email changing usually requires verification
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('phone_number')}</label>
                                        <div className="relative">
                                            <FaPhone className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C] focus:border-transparent outline-none transition-all"
                                                placeholder={t('phone_placeholder')}
                                            />
                                        </div>
                                    </div>

                                    {/* Date of Birth (New Field) */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('date_of_birth')}</label>
                                        <div className="relative">
                                            <FaBirthdayCake className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C] focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Gender (New Field) */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('gender')}</label>
                                        <div className="relative">
                                            <FaTransgender className="absolute left-3 top-3 text-gray-400" />
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C] focus:border-transparent outline-none transition-all appearance-none bg-white"
                                            >
                                                <option value="">{t('select_gender')}</option>
                                                <option value="Male">{t('male')}</option>
                                                <option value="Female">{t('female')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio / About */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{t('about_me')}</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C] focus:border-transparent outline-none transition-all resize-none"
                                        placeholder={t('bio_placeholder')}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;

// Revision note [2026-07-22 14:34:17 +0300]: Update i18n translations and labels

// Revision note [2026-08-05 18:11:41 +0300]: Refactor login page glassmorphism styling
