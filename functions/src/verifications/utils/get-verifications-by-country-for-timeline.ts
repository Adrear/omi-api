import { CollectionReference } from '@google-cloud/firestore';
import { VerificationDocument } from '../documents/index.document';
import { Logger } from '@nestjs/common';

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
        const transformedData: { [key: string]: any } = {
            countryID: countryID,
            days: []
        };

        for (let i = 1; i <= days; i++) {
            const currentDay = getDateNDaysAgo(i);
            const snapshot = await verificationsCollection
                .where('day', '==', currentDay)
                .where('serviceID', 'in', services)
                .get();

            if (!snapshot.empty) {
                const dayData: { [key: string]: any } = {
                    day: currentDay,
                };

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const serviceID = data.serviceID;
                    if (data[countryID] && data[countryID].count > 0) {
                        dayData[serviceID] = data[countryID];
                    }
                });

                transformedData.days.push(dayData);
            }
        }

        return transformedData.days.length > 0 ? transformedData : null;
    } catch (error) {
        logger.error('Error in getVerificationsByCountryForTimeline:', error);
        throw error;
    }
}