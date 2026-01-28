// Reusable component for displaying truncated addresses with hover tooltip
export const TruncatedAddress = ({ address, maxLength = 40, className = "" }) => {
  if (!address) return <span className={className}>N/A</span>;

  const truncatedAddress = address.length > maxLength 
    ? `${address.slice(0, maxLength)}...` 
    : address;

  return (
    <span 
      className={`${className} cursor-help`}
      title={address}
    >
      {truncatedAddress}
    </span>
  );
};
