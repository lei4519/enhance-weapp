import { promisifyAll } from 'miniprogram-api-promise'
import { requestMethod, interceptors } from './request'

export const wxp: any = {}
promisifyAll(wx, wxp)
wxp.request = requestMethod
wxp.request.interceptors = interceptors
