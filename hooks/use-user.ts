import { getUserProfile, updateUserSettings } from "@/app/api/users/userService";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserSettings,
    onSuccess: (data: { address: string }) => {
      // Khi update settings thành công,
      // làm mới lại (refetch) query 'profile'
      // Giả sử address là key định danh user
      queryClient.invalidateQueries({ queryKey: ['profile', data.address] });
    },
    onError: (error) => {
      console.error("Lỗi khi cập nhật settings:", error);
      // Xử lý thông báo lỗi cho người dùng ở đây
    }
  });
}

export function useGetUserProfile(profileId: string) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => getUserProfile(profileId),
  });
}