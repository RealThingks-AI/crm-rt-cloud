/**
 * Utility functions for converting emails and user data to display names
 */

/**
 * Converts an email address to a formatted display name
 * e.g., "peter.jakobsson@realthingks.com" → "Peter Jakobsson"
 */
export const emailToDisplayName = (email: string): string => {
  if (!email) return 'Unknown User';
  
  const emailName = email.split('@')[0];
  return emailName
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

/**
 * Gets display name from user metadata or email
 * Prioritizes: metadata.full_name → metadata.name → formatted email → fallback
 */
export const getUserDisplayName = (user: {
  user_metadata?: { full_name?: string; name?: string };
  email?: string;
}): string => {
  // Prioritize auth user metadata
  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  if (metadataName) return metadataName;
  
  // Format email to display name
  if (user.email) return emailToDisplayName(user.email);
  
  return 'Unknown User';
};

/**
 * Formats any user identifier (email, name, or ID) to a display name
 * This is the main function to use throughout the application
 */
export const formatUserDisplayName = (userIdentifier: string | null | undefined): string => {
  if (!userIdentifier) return 'Unknown User';
  
  // If it looks like an email, format it
  if (userIdentifier.includes('@')) {
    return emailToDisplayName(userIdentifier);
  }
  
  // If it's already a formatted name, return as is
  if (userIdentifier.includes(' ') && userIdentifier.charAt(0) === userIdentifier.charAt(0).toUpperCase()) {
    return userIdentifier;
  }
  
  // If it's a UUID or other identifier, try to format it as a name
  if (userIdentifier.includes('.')) {
    return userIdentifier
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  
  return userIdentifier;
};