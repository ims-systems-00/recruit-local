'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import { ApiResponse } from '@/types/api';
import {
  SkillCatalogListBackendResponse,
  SkillCatalogListFilters,
  SkillCatalogListResponse,
} from './skill-catalog.type';
import qs from 'qs';

const API_ENDPOINT = '/skill-catalog';

export async function getSkillCatalog(
  params?: SkillCatalogListFilters,
): Promise<ApiResponse<SkillCatalogListResponse>> {
  try {
    const res = await axiosServer.get<SkillCatalogListBackendResponse>(
      API_ENDPOINT,
      {
        params: {
          cursor: params?.cursor,
          limit: params?.limit || 10,
          clientSearch: params?.clientSearch,
        },
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: 'brackets' }),
      },
    );

    return {
      success: true,
      data: {
        skills: res.data.skills || [],
        pagination: res.data.pagination,
      },
      message: res.data.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch skills');
  }
}
