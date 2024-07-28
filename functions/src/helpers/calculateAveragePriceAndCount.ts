interface ProviderInfo {
    cost: number;
    count: number;
}
interface PriceInfoFiveSim {
    [provider: string]: ProviderInfo;
}

interface PriceInfoSmshub {
    [price: string]: number;
}
export function calculateAveragePriceAndCountFiveSim(priceInfo: PriceInfoFiveSim): { price: number; count: number } {
    let totalWeightedPrice = 0;
    let totalCount = 0;

    for (const [, { cost, count }] of Object.entries(priceInfo)) {
        totalWeightedPrice += cost * count;
        totalCount += count;
    }

    const averagePrice = totalCount > 0 ? totalWeightedPrice / totalCount : 0;

    return {
        price: averagePrice,
        count: totalCount
    };
}

export function calculateAveragePriceAndCountSmshub(priceInfo: PriceInfoSmshub): { price: number; count: number } {
    let totalWeightedPrice = 0;
    let totalCount = 0;
    for (const [price, count] of Object.entries(priceInfo)) {
        const numericPrice = parseFloat(price);
        totalWeightedPrice += numericPrice * (count as number);
        totalCount += count as number;
    }
    const averagePrice = totalCount > 0 ? totalWeightedPrice / totalCount : 0;
    return {
        price: averagePrice,
        count: totalCount
    };
}