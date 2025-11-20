export * from './messaging.module';
export { MessagingService } from './messaging.service';
export * from './messaging.controller';
export * from './messageRouter';
export * from './constants';
export * from './channels';

// Export interfaces first
export * from './interfaces/messaging.interface';

// Export utilities, excluding MessageTemplate to avoid conflict
export { processTemplate, validateTemplateParams, getPredefinedTemplate, getPredefinedTemplatesByChannel, createCustomTemplate, PREDEFINED_TEMPLATES } from './utils';
