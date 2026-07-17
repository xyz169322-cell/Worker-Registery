// Stub for missing react-native-svg web utility
// react-native-svg 15.x is missing this file in its web bundle
export function hasTouchableProperty(props) {
  return (
    props.onPress !== undefined ||
    props.onLongPress !== undefined ||
    props.onPressIn !== undefined ||
    props.onPressOut !== undefined
  );
}
