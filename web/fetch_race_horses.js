import axios from 'axios';
axios.get('https://managerhourse-be.onrender.com/races/6a30c2b60c49374b6f88a111/horses')
  .then(res => {
    console.log('API RESPONSE STATUS:', res.status);
    console.log('API RESPONSE DATA:', JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    if (err.response) {
      console.error('ERROR RESPONSE:', err.response.data);
    }
  });
