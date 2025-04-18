// 预设的公版文字碎片
export const fragmentData = [
    { id: 'f1', text: '明月', source: '唐诗' },
    { id: 'f2', text: '松间照', source: '唐诗' },
    { id: 'f3', text: '清泉', source: '唐诗' },
    { id: 'f4', text: '石上流', source: '唐诗' },
    { id: 'f5', text: '红豆', source: '宋词' },
    { id: 'f6', text: '生南国', source: '宋词' },
    { id: 'f7', text: '春来', source: '宋词' },
    { id: 'f8', text: '发几枝', source: '宋词' },
    { id: 'f9', text: '细雨', source: '宋词' },
    { id: 'f10', text: '湿花红', source: '宋词' },
    { id: 'f11', text: '微风', source: '宋词' },
    { id: 'f12', text: '拂柳绿', source: '宋词' },
    { id: 'f13', text: '夜来', source: '唐诗' },
    { id: 'f14', text: '风雨声', source: '唐诗' },
    { id: 'f15', text: '花落', source: '唐诗' },
    { id: 'f16', text: '知多少', source: '唐诗' },
    { id: 'f17', text: '青山', source: '宋词' },
    { id: 'f18', text: '遮不住', source: '宋词' },
    { id: 'f19', text: '毕竟', source: '宋词' },
    { id: 'f20', text: '东流去', source: '宋词' },
    { id: 'f21', text: '不知', source: '元曲' },
    { id: 'f22', text: '相思', source: '元曲' },
    { id: 'f23', text: '苦', source: '元曲' },
    { id: 'f24', text: '归来', source: '元曲' },
    { id: 'f25', text: '蓦然回首', source: '宋词' },
    { id: 'f26', text: '那人', source: '宋词' },
    { id: 'f27', text: '却在', source: '宋词' },
    { id: 'f28', text: '灯火阑珊处', source: '宋词' },
    { id: 'f29', text: '莫愁', source: '唐诗' },
    { id: 'f30', text: '前路', source: '唐诗' },
    { id: 'f31', text: '无知己', source: '唐诗' },
    { id: 'f32', text: '天下谁人不识君', source: '唐诗' }
];

// 搜索公版碎片
export function searchFragments(keyword) {
    if (!keyword) return [];

    return fragmentData.filter(fragment =>
        fragment.text.includes(keyword) ||
        fragment.source.includes(keyword)
    );
}

// 获取随机碎片（用于初始化）
export function getRandomFragments(count = 100) {
    const shuffled = [...fragmentData].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
} 