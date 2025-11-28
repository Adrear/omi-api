import { CollectionReference } from '@google-cloud/firestore';
import { VerificationDocument } from '../documents/index.document';

export async function getVerificationsByServiceForTimelineUtil({
                                                                   serviceID,
                                                                   verificationsCollection,
                                                                   limit = 5
                                                               }: {
    serviceID: string;
    verificationsCollection: CollectionReference<VerificationDocument>;
    limit?: number;
}) {
    const servicesSnapshot = await verificationsCollection
        .where('serviceID', '==', serviceID)
        .orderBy('day', 'desc')
        .limit(limit)
        .get();

    return servicesSnapshot.docs.map(doc => doc.data());
}
