// I have an Expo React Native app with a modal for adding expenses.
// I want to integrate receipt scanning using expo-camera and expo-image-picker.
//
// Flow:
// 1. User taps camera or gallery button
// 2. Capture or pick an image
// 3. Send image to a function called extractReceiptData(imageUri)
// 4. This function calls my backend (Gemini API) and returns JSON:
//    { total_amount: number }
// 5. After extraction:
//    - open the modal (setIsModalVisible(true))
//    - autofill amountInput with the extracted total
//
// Requirements:
// - Handle both camera and gallery
// - Show loading state while extracting
// - If extraction fails, still open modal with empty amount
// - Keep existing modal logic intact
//
// Generate:
// - openCamera()
// - pickImage()
// - processReceipt(imageUri)
// - integration with state (setAmountInput, setIsModalVisible)