import { idpsApi } from "@/features/modules/idps/services/api/idps.api";

export const idpsRulesLoader = async () => {
  try {
    const response = await idpsApi.getIdpsRules({ page: 1, limit: 20 }); // Mặc định load trang 1 với 20 bản ghi
    if (response.success) {
        console.log("Raw API response:", response);
        console.log("Extracted data:", response.data);
      return response.data; 
    }
    throw new Error(response.message);
  } catch (error) {
    throw new Response("Không thể tải dữ liệu", { status: 500 });
  }
};