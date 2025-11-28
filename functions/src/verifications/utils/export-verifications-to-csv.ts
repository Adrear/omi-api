import { CollectionReference } from '@google-cloud/firestore';
import { VerificationDocument } from '../documents/index.document';
import { Logger } from '@nestjs/common';
import { Parser } from 'json2csv';
import * as fs from 'fs';

export async function exportVerificationsToCSVUtil({
                                                       day,
                                                       verificationsCollection,
                                                       logger,
                                                   }: {
    day: string;
    verificationsCollection: CollectionReference<VerificationDocument>;
    logger: Logger;
}) {
    try {
        const verificationsSnapshot = await verificationsCollection.where('day', '==', day).get();

        if (verificationsSnapshot.empty) {
            logger.log(`No verifications found for day: ${day}`);
            return;
        }

        const verificationsData: any[] = [];

        verificationsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const verificationEntry: { [key: string]: any } = {
                id: doc.id,
                day: data.day,
                serviceID: data.serviceID,
                totalServiceCount: data.totalServiceCount,
                verificationsFor100USD: data.verificationsFor100USD,
                createdAt: data.createdAt && data.createdAt.toDate().toISOString(),
            };

            Object.keys(data).forEach((key) => {
                if (
                    !['day', 'serviceID', 'totalServiceCount', 'verificationsFor100USD', 'createdAt'].includes(key)
                ) {
                    verificationEntry[`${key}_priceUSD`] = data[key]?.priceUSD || 0;
                    verificationEntry[`${key}_count`] = data[key]?.count || 0;
                }
            });

            verificationsData.push(verificationEntry);
        });

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(verificationsData);

        const filePath = `verifications_${day}.csv`;
        fs.writeFileSync(filePath, csv);

        logger.log(`CSV file created: ${filePath}`);
    } catch (error) {
        logger.error('Error exporting verifications to CSV:', error);
    }
}
