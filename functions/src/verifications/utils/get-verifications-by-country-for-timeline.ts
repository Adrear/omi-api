import { CollectionReference } from '@google-cloud/firestore';
import { VerificationDocument } from '../documents/index.document';
import { Logger } from '@nestjs/common';

const MAX_DAYS = 60;
const IN_QUERY_LIMIT = 10;

function getDateNDaysAgo(n: number): string {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return formatDateToString(date);
}

function formatDateToString(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

export async function getVerificationsByCountryForTimelineUtil({
                                                                   countryID,
                                                                   services,
                                                                   days,
                                                                   verificationsCollection,
                                                                   logger
                                                               }: {
    countryID: string;
    services: string[];
    days: number;
    verificationsCollection: CollectionReference<VerificationDocument>;
    logger: Logger;
}) {
    try {
        const safeDays = Math.max(1, Math.min(Number(days) || 0, MAX_DAYS));
        const serviceIds = Array.isArray(services) ? Array.from(new Set(services.filter(Boolean))) : [];

        if (!serviceIds.length) {
            logger.warn('No services provided for timeline request.');
            return null;
        }

        const transformedData: { [key: string]: any } = {
            countryID: countryID,
            days: []
        };

        for (let i = 1; i <= safeDays; i++) {
            const currentDay = getDateNDaysAgo(i);
            const dayData: { [key: string]: any } = { day: currentDay };
            let found = false;

            const serviceChunks = chunk(serviceIds, IN_QUERY_LIMIT);

            for (const chunkIds of serviceChunks) {
                const snapshot = await verificationsCollection
                    .where('day', '==', currentDay)
                    .where('serviceID', 'in', chunkIds)
                    .get();

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const serviceID = data.serviceID;
                    if (data[countryID] && data[countryID].count > 0) {
                        dayData[serviceID] = data[countryID];
                        found = true;
                    }
                });
            }

            if (found) {
                transformedData.days.push(dayData);
            }
        }

        return transformedData.days.length > 0 ? transformedData : null;
    } catch (error) {
        logger.error('Error in getVerificationsByCountryForTimeline:', error);
        throw error;
    }
}
