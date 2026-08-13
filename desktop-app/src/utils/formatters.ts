export const formatSignatureTitle = (signature: string): string => {
  if (!signature) return 'Unknown Error';
  
  // Check if it matches the semantic format: Type:Class:Method:Message
  const parts = signature.split(':');
  if (parts.length >= 3) {
    const rawType = parts[0];
    const type = rawType !== 'UNKNOWN' ? (rawType.split('.').pop() || rawType) : '';
    const sourceClass = parts[1] !== 'UNKNOWN' ? (parts[1].split('.').pop() || parts[1]) : '';
    const method = parts[2] !== 'UNKNOWN' ? parts[2] : '';
    const message = parts.slice(3).join(':').trim();
    
    if (type) {
      let title = type;
      if (sourceClass || method) {
        title += ` in ${sourceClass}${sourceClass && method ? '.' : ''}${method}`;
      } else if (message) {
        const cleanMsg = message.charAt(0).toUpperCase() + message.slice(1);
        title += `: ${cleanMsg}`;
      }
      return title;
    } else if (message) {
      return message.charAt(0).toUpperCase() + message.slice(1);
    }
  }
  
  return signature;
};
