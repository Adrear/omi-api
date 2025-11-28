import { CollectionReference, Timestamp } from '@google-cloud/firestore';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import pLimit from 'p-limit';
import { VerificationDocument } from '../documents/index.document';
import { ServiceDocument } from '../../services/documents/service.document';
import { CountryDocument } from '../../countries/documents/country.document';

interface VerificationEntry {
    priceUSD: number;
    count: number;
}

export async function createVerificationsUtil({
                                                  day,
                                                  logger,
                                                  verificationsCollection,
                                                  servicesCollection,
                                                  countriesCollection,
                                                  smsActivateService,
                                                  fiveSimService,
                                                  smspvaService,
                                                  smshubService,
                                              }: {
    day: string;
    logger: Logger;
    verificationsCollection: CollectionReference<VerificationDocument>;
    servicesCollection: CollectionReference<ServiceDocument>;
    countriesCollection: CollectionReference<CountryDocument>;
    smsActivateService: any;
    fiveSimService: any;
    smspvaService: any;
    smshubService: any;
}) {
    try {
        const getExchangeRate = async (): Promise<number> => {
            try {
                const response = await axios.get('https://v6.exchangerate-api.com/v6/cc921650c3cd76ed6d008c04/latest/USD');
                const exchangeRate = response.data.conversion_rates?.RUB;
                if (!exchangeRate) {
                    logger.warn('Exchange rate RUB to USD not found. Defaulting to 100.');
                    return 100;
                }
                return exchangeRate;
            } catch (error: any) {
                logger.error('Failed to fetch exchange rate. Defaulting to 100:', error.message);
                return 100;
            }
        };

        const exchangeRate = await getExchangeRate();

        const limit = pLimit(5);
        let batch = verificationsCollection.firestore.batch();
        const servicesSnapshot = await servicesCollection.get();

        const promises = servicesSnapshot.docs.map((serviceDoc) =>
            limit(async () => {
                logger.log(serviceDoc.id);

                const [smsActivateDocs, fiveSimDocs, smspvaDocs, smshubDocs] = await Promise.all([
                    serviceDoc.data().id_activate ? smsActivateService.getVerificationsByDayAndService({
                        day: day,
                        service_code: serviceDoc.data().id_activate
                    }) : Promise.resolve([]),
                    serviceDoc.data().id_5sim ? fiveSimService.getVerificationsByDayAndService({
                        day: day,
                        service_code: serviceDoc.data().id_5sim
                    }) : Promise.resolve([]),
                    serviceDoc.data().id_smspva ? smspvaService.getVerificationsByDayAndService({
                        day: day,
                        service_code: serviceDoc.data().id_smspva
                    }) : Promise.resolve([]),
                    serviceDoc.data().id_smshub ? smshubService.getVerificationsByDayAndService({
                        day: day,
                        service_code: serviceDoc.data().id_smshub
                    }) : Promise.resolve([])
                ]);

                const countriesSnapshot = await countriesCollection.get();
                const verification: { [countryId: string]: VerificationEntry } = {};
                let totalServiceCount = 0;
                let verificationsFor100USD = 0;

                for (const countryDoc of countriesSnapshot.docs) {
                    const smsActivateDoc = smsActivateDocs.find((el: any) => el.country === countryDoc.data().id_activate);
                    const fiveSimDoc = fiveSimDocs.find((el: any) => el.country === countryDoc.data().id_5sim);
                    const smspvaDoc = smspvaDocs.find((el: any) => el.country === countryDoc.data().id_smspva);
                    const smshubDoc = smshubDocs.find((el: any) => el.country === countryDoc.data().id_smshub);

                    const totalCount = (smsActivateDoc?.count || 0) + (fiveSimDoc?.count || 0) + (smspvaDoc?.count || 0) + (smshubDoc?.count || 0);

                    const countryPrice = (
                        ((smsActivateDoc?.price || 0) / exchangeRate * (smsActivateDoc?.count || 0)) +
                        ((fiveSimDoc?.price || 0) / exchangeRate * (fiveSimDoc?.count || 0)) +
                        ((smspvaDoc?.price || 0) * (smspvaDoc?.count || 0)) +
                        ((smshubDoc?.price || 0) * (smshubDoc?.count || 0))
                    ) / (totalCount || 1); // уникнути ділення на 0

                    if (totalCount > 0) {
                        verification[countryDoc.id] = {
                            priceUSD: countryPrice,
                            count: totalCount
                        };
                        totalServiceCount += totalCount;
                        verificationsFor100USD += (100 / countryPrice) * totalCount;
                    }
                }

                const verificationData = {
                    day: day,
                    createdAt: Timestamp.now(),
                    serviceID: serviceDoc.id,
                    totalServiceCount,
                    verificationsFor100USD,
                    ...verification
                };

                const docRef = verificationsCollection.doc(`${day}_${serviceDoc.id}`);
                batch.set(docRef, verificationData);
                await servicesCollection.doc(serviceDoc.id).update({ totalServiceCount });
            })
        );

        await Promise.all(promises);
        await batch.commit();

    } catch (error) {
        logger.error('Error in createVerifications:', error);
    }
}
