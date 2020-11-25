import { LooseObject } from '../types';
/**
 * @description diff新旧数据，返回差异路径对象
 *
 * 对值的操作分三种
 *
 *      新增：{ 值路径：新值 }
 *
 *      修改：{ 值路径：新值 }
 *
 *      删除：{ 父值路径：父新值 }
 *
 * @warning 不要删除根节点this.data上面的值，因为在小程序中无法通过this.setData来删除this.data上面的值
 * @param {Object} oldRootData 旧值: this.data
 * @param {Object} newRootData 新值: this.data$
 * @return {Object}  传给this.setData的值
 */
export declare function diffData(oldRootData: LooseObject, newRootData: LooseObject): [LooseObject | null, boolean];
