/* Shared destination content for the destination listing and detail pages. */
window.PHOTOS = {
  entebbe: 'https://cdn.jambojet.com/media/x3ipjhb1/ebb_bnanner_2-1.png',
  lamu: 'https://cdn.jambojet.com/media/rpuhyrn0/lau-1500-x-500px.jpg',
  malindi: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85',
  diani: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=85',
  mombasa: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85',
  kisumu: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=85',
  eldoret: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=85',
  nairobi: 'https://cdn.jambojet.com/media/ytbffvtq/_nairobi-1500-x-500px.jpg'
};
window.photoUrl = value => !value ? '' : /^https?:/.test(value) ? value : `https://unsplash.com/photos/${value}/download?w=1200`;

window.DEST = {
  entebbe: {
    name: 'Entebbe',
    code: 'EBB',
    airport: 'Entebbe International Airport (EBB)',
    duration: 'Approximately 1 hour 30 minutes',
    blurb: 'Perched on the shores of Lake Victoria and a short transfer from Kampala, Entebbe is one of East Africa’s busiest hubs.',
    todo: [
      'Walk the Entebbe Botanical Gardens on the lake shore',
      'Visit the Uganda Wildlife Education Centre',
      'Take a boat trip on Lake Victoria',
      'Use Entebbe as your gateway to Kampala'
    ]
  },
  lamu: {
    name: 'Lamu',
    code: 'LAU',
    airport: 'Lamu (Manda Airport)',
    duration: 'Approximately 1 hour 40 minutes',
    daily: 'One daily flight for ultimate convenience',
    blurb: 'Lamu Old Town is a UNESCO World Heritage Site and the oldest, best-preserved Swahili settlement in East Africa, with car-free streets and coral-stone houses.',
    todo: [
      'Wander the car-free streets of Lamu Old Town',
      'Sail on a traditional dhow at sunset',
      'Relax on Shela beach',
      'Browse the markets for carved wood and woven baskets'
    ]
  },
  malindi: {
    name: 'Malindi',
    code: 'MYD',
    airport: 'Malindi Airport (MYD)',
    blurb: 'A relaxed Indian Ocean town known for its beaches, marine park and Swahili-Portuguese history.',
    todo: [
      'Snorkel in the Malindi Marine National Park',
      'Relax on the beach',
      'Eat fresh seafood on the waterfront'
    ]
  },
  diani: {
    name: 'Diani',
    code: 'UKA',
    airport: 'Ukunda (Diani) Airstrip (UKA)',
    duration: 'Approximately 1 hour 15 minutes',
    blurb: 'Diani is famed for its white-sand beach, palm trees and warm Indian Ocean water, just south of Mombasa.',
    todo: [
      'Spend a day on the white-sand beach',
      'Try kitesurfing, diving or snorkelling',
      'Take a boat trip to the reef',
      'Watch the sunset with a drink on the sand'
    ]
  },
  mombasa: {
    name: 'Mombasa',
    code: 'MBA',
    airport: 'Moi International Airport (MBA)',
    blurb: 'Kenya’s coastal gateway, with a historic old town, Fort Jesus and a lively waterfront.',
    todo: [
      'Tour Fort Jesus and the Old Town',
      'Eat street food and coastal seafood',
      'Visit the beaches north and south of the city'
    ]
  },
  kisumu: {
    name: 'Kisumu',
    code: 'KIS',
    airport: 'Kisumu International Airport (KIS)',
    blurb: 'A lakeside city on Lake Victoria with a relaxed pace, fresh fish and sunsets over the water.',
    todo: [
      'Take a boat out on Lake Victoria',
      'Visit the Kisumu Impala Sanctuary',
      'Eat fresh tilapia at the lakefront'
    ]
  },
  eldoret: {
    name: 'Eldoret',
    code: 'EDL',
    airport: 'Eldoret International Airport (EDL)',
    blurb: 'The highland home of Kenya’s running champions, set among rolling green farmland.',
    todo: [
      'Visit the running camps and training tracks',
      'Tour the surrounding farmland',
      'Explore Eldoret town and its markets'
    ]
  },
  nairobi: {
    name: 'Nairobi',
    code: 'NBO',
    airport: 'Jomo Kenyatta International Airport (JKIA)',
    blurb: 'Kenya’s capital and BUUPASS’s main hub, with a national park right on the city’s edge.',
    todo: [
      'Visit Nairobi National Park',
      'See the Giraffe Centre and the elephant orphanage',
      'Explore museums, markets and restaurants'
    ]
  }
};

window.DEST_KEYS = ['entebbe', 'lamu', 'malindi', 'diani', 'mombasa', 'kisumu', 'eldoret', 'nairobi'];
window.ORIGIN_FOR = key => key === 'nairobi' ? 'mombasa' : 'nairobi';
