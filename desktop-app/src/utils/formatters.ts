export const formatSignatureTitle = (signature: string): string => {
  if (!signature) return 'Unknown Error';
  
  // Check if it matches the semantic format: Type:Class:Method:Message
  const parts = signature.split(':');
  if (parts.length >= 3) {
    const type = parts[0].split('.').pop() || parts[0];
    const sourceClass = parts[1] !== 'UNKNOWN' ? (parts[1].split('.').pop() || parts[1]) : '';
    const method = parts[2] !== 'UNKNOWN' ? parts[2] : '';
    
    let title = type;
    if (sourceClass || method) {
      title += ` in ${sourceClass}${sourceClass && method ? '.' : ''}${method}`;
    }
    return title;
  }
  
  return signature;
};
