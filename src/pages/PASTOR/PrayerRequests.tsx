import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaPray, FaFilter, FaSort, FaEye, FaTimes } from 'react-icons/fa';
import CombinedNav from '../../components/CombinedNav';

// GraphQL query for fetching prayer requests
const GET_PRAYER_REQUESTS = gql`
  query GetPrayerRequests($page: Int!, $status: String, $search: String) {
    prayerRequests(page: $page, status: $status, search: $search) {
      totalCount
      edges {
        node {
          id
          title
          description
          submittedBy {
            fullName
            email
          }
          status
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        currentPage
      }
    }
  }
`;

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  submittedBy: {
    fullName: string;
    email: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PrayerRequestsData {
  prayerRequests: {
    totalCount: number;
    edges: { node: PrayerRequest }[];
    pageInfo: {
      hasNextPage: boolean;
      currentPage: number;
    };
  };
}

const PrayerRequests = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data, loading, error, refetch } = useQuery<PrayerRequestsData>(GET_PRAYER_REQUESTS, {
    variables: { page, status: statusFilter, search: searchTerm },
    fetchPolicy: 'network-only',
  });

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    refetch({ page: newPage, status: statusFilter, search: searchTerm });
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    refetch({ page: 1, status: statusFilter, search: searchTerm });
  };

  // Handle filter and search
  const applyFilters = () => {
    setPage(1);
    refetch({ page: 1, status: statusFilter, search: searchTerm });
    setIsFilterOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
    setPage(1);
    refetch({ page: 1, status: '', search: '' });
    setIsFilterOpen(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{t('error_loading_prayer_requests')}</p>
      </div>
    );
  }

  return (
    <CombinedNav>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center space-x-3">
            <FaPray className="text-3xl text-[#5E936C]" />
            <h1 className="text-3xl font-bold text-[#2D3748]">
              {t('prayer_requests')}
            </h1>
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 bg-[#5E936C] text-[#E8FFD7] px-4 py-2 rounded-md hover:bg-[#4A7557] transition-colors"
          >
            <FaFilter />
            <span>{t('filters')}</span>
          </button>
        </motion.div>

        {/* Filters Section */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-md mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D3748] mb-1">
                    {t('status')}
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E936C]"
                  >
                    <option value="">{t('all_statuses')}</option>
                    <option value="PENDING">{t('pending')}</option>
                    <option value="ANSWERED">{t('answered')}</option>
                    <option value="IN_PROGRESS">{t('in_progress')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D3748] mb-1">
                    {t('search')}
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('search_prayer_requests')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E936C]"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-[#5E936C] text-[#E8FFD7] px-4 py-2 rounded-md hover:bg-[#4A7557] transition-colors"
                  >
                    {t('apply_filters')}
                  </button>
                  <button
                    onClick={resetFilters}
                    className="flex-1 bg-gray-300 text-[#2D3748] px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    {t('reset_filters')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prayer Requests Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#5E936C] text-[#E8FFD7]">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('title')}</span>
                      {sortField === 'title' && (
                        <FaSort className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('submittedBy')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('submitted_by')}</span>
                      {sortField === 'submittedBy' && (
                        <FaSort className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('status')}</span>
                      {sortField === 'status' && (
                        <FaSort className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{t('submitted_on')}</span>
                      {sortField === 'createdAt' && (
                        <FaSort className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {t('loading')}
                    </td>
                  </tr>
                ) : data?.prayerRequests.edges.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {t('no_prayer_requests')}
                    </td>
                  </tr>
                ) : (
                  data?.prayerRequests.edges.map(({ node }) => (
                    <tr key={node.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2D3748]">
                        {node.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2D3748]">
                        {node.submittedBy.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            node.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : node.status === 'ANSWERED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t(node.status.toLowerCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2D3748]">
                        {formatDate(node.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedRequest(node)}
                          className="text-[#5E936C] hover:text-[#4A7557]"
                          aria-label={t('view_details')}
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        {data?.prayerRequests.pageInfo && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-[#2D3748]">
              {t('showing')} {data.prayerRequests.edges.length} {t('of')}{' '}
              {data.prayerRequests.totalCount} {t('prayer_requests')}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-[#5E936C] text-[#E8FFD7] rounded-md disabled:bg-gray-300 disabled:text-gray-500"
              >
                {t('previous')}
              </button>
              <span className="px-4 py-2 text-[#2D3748]">
                {t('page')} {data.prayerRequests.pageInfo.currentPage}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!data.prayerRequests.pageInfo.hasNextPage}
                className="px-4 py-2 bg-[#5E936C] text-[#E8FFD7] rounded-md disabled:bg-gray-300 disabled:text-gray-500"
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}

        {/* Prayer Request Details Modal */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-[#2D3748]">
                    {selectedRequest.title}
                  </h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-[#2D3748] hover:text-[#5E936C]"
                    aria-label={t('close')}
                  >
                    <FaTimes />
                  </button>
                </div>
                <p className="text-sm text-[#2D3748] mb-2">
                  <span className="font-semibold">{t('submitted_by')}:</span>{' '}
                  {selectedRequest.submittedBy.fullName} (
                  {selectedRequest.submittedBy.email})
                </p>
                <p className="text-sm text-[#2D3748] mb-2">
                  <span className="font-semibold">{t('status')}:</span>{' '}
                  {t(selectedRequest.status.toLowerCase())}
                </p>
                <p className="text-sm text-[#2D3748] mb-2">
                  <span className="font-semibold">{t('submitted_on')}:</span>{' '}
                  {formatDate(selectedRequest.createdAt)}
                </p>
                <p className="text-sm text-[#2D3748] mb-4">
                  <span className="font-semibold">{t('description')}:</span>{' '}
                  {selectedRequest.description}
                </p>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full bg-[#5E936C] text-[#E8FFD7] px-4 py-2 rounded-md hover:bg-[#4A7557] transition-colors"
                >
                  {t('close')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CombinedNav>
  );
};

export default PrayerRequests;