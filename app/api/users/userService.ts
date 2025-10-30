import { api } from '../apiClient';

/**
 * Cập nhật user settings (dùng cho Mutation)
 * @param {object} data - Gồm { address, settings }
 */
export const updateUserSettings = async ({ address, settings }: { address: string, settings: Record<string, any> }) => {
  // Sẽ gọi: POST https://api.yourdomain.com/v1/users/settings
  const { data } = await api.post('/users/settings', { address, settings });
  return data;
};

/**
 * Lấy user profile (dùng cho Query)
 * @param {string} profileId - ID của profile
 */
export const getUserProfile = async (profileId: string) => {
  // Sẽ gọi: GET https://api.yourdomain.com/v1/users/profile/some-id
  const { data } = await api.get(`/users/profile/${profileId}`);
  return data;
};