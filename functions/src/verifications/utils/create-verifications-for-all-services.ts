// import {VerificationDocument} from "../documents/verification.document";
//
// async updateCountryIndexes(day: string) {
//     try {
//         const verificationsSnapshot = await this.verificationsCollection
//             .where('day', '==', day)
//             .get();
//
//         const countriesSnapshot = await this.countriesCollection
//             .where('not_used', '==', false)
//             .get();
//
//         if (verificationsSnapshot.empty) {
//             return null;
//         }
//         for (const countryDoc of countriesSnapshot.docs) {
//             let totalCountryCount = 0
//             verificationsSnapshot.docs.forEach(verificationDoc => {
//                 const data = verificationDoc.data() as VerificationDocument;
//                 if (data[countryDoc.id] && data[countryDoc.id].count > 0) {
//                     totalCountryCount += data[countryDoc.id].count;
//                 }
//             });
//
//             await this.countriesCollection.doc(countryDoc.id).update({ totalCountryCount });
//         }
//         return 'finish'
//     } catch (error) {
//         this.logger.error('Error in getLastVerificationsByCountry:', error);
//         throw error;
//     }
// }