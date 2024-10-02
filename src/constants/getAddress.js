const getAddress = async (latitude, longitude) => {
    const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
    const geoResponse = await axios.get(reverseGeocodeUrl);
    if (geoResponse.data.features.length > 0) {
      let barangay = "";
      let district = "";

      const addressComponents = geoResponse.data.features[0].context;

      addressComponents.forEach((component) => {
        if (component.id.includes("locality")) {
          barangay = component.text;
        } else if (component.id.includes("place")) {
          district = component.text;
        }
      });

      return `${barangay}, ${district}` || "Address not found";
    }
    return "Address not found";
  };

   // Fetch addresses
   const pickupAddress = await getAddress(
    newAcceptedBooking.pickupLocation.latitude,
    newAcceptedBooking.pickupLocation.longitude
  );
  const destinationAddress = await getAddress(
    newAcceptedBooking.destinationLocation.latitude,
    newAcceptedBooking.destinationLocation.longitude
  );

  newAcceptedBooking.pickupAddress = pickupAddress;
  newAcceptedBooking.destinationAddress = destinationAddress;