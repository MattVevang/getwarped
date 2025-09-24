/**
 * ServiceTemplateGrid component
 *
 * Grid display for service templates with search, filtering, and categories
 * Allows users to quickly select from predefined service configurations
 */

import React, { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Typography,
  Space,
  Avatar,
  Tag,
  Empty,
  Button,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  PlusOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import {
  ServiceTemplate,
  ServiceCategory,
  TemplateFeature,
} from '../../../shared/types/ServiceTemplate';

const { Title, Text } = Typography;
const { Meta } = Card;

interface ServiceTemplateGridProps {
  templates: ServiceTemplate[];
  onTemplateSelect?: (template: ServiceTemplate) => void;
  selectedTemplateId?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ServiceTemplateGrid for displaying and selecting service templates
 *
 * Features:
 * - Grid layout with responsive columns
 * - Search functionality by name and description
 * - Category filtering
 * - Feature filtering
 * - Template selection with highlighting
 * - Popular/featured template promotion
 * - Empty state handling
 */
const ServiceTemplateGrid: React.FC<ServiceTemplateGridProps> = ({
  templates,
  onTemplateSelect,
  selectedTemplateId,
  loading = false,
  className,
  style,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [selectedFeatures, setSelectedFeatures] = useState<TemplateFeature[]>([]);

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template: ServiceTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  /**
   * Filter templates based on search and filters
   */
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Search filter
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.url.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

      if (!matchesCategory) return false;

      // Features filter
      const matchesFeatures =
        selectedFeatures.length === 0 ||
        selectedFeatures.every(feature => template.supportedFeatures.includes(feature));

      return matchesFeatures;
    });
  }, [templates, searchTerm, selectedCategory, selectedFeatures]);

  /**
   * Get available categories from templates
   */
  const availableCategories = useMemo(() => {
    const categories = new Set(templates.map(t => t.category));
    return Array.from(categories).sort();
  }, [templates]);

  /**
   * Get category display options
   */
  const getCategoryOptions = () => [
    { label: 'All Categories', value: 'all' },
    ...availableCategories.map(category => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      value: category,
    })),
  ];

  /**
   * Get feature display options
   */
  const getFeatureOptions = () => [
    { label: 'Notifications', value: TemplateFeature.NOTIFICATIONS },
    { label: 'Ad Blocking', value: TemplateFeature.AD_BLOCKING },
    { label: 'Tracker Blocking', value: TemplateFeature.TRACKER_BLOCKING },
    { label: 'Custom User Agent', value: TemplateFeature.CUSTOM_USER_AGENT },
    { label: 'Custom Theming', value: TemplateFeature.CUSTOM_THEMING },
  ];

  /**
   * Get template icon
   */
  const getTemplateIcon = (template: ServiceTemplate) => {
    if (template.icon) {
      return (
        <Avatar
          src={template.icon}
          size={48}
          style={{ backgroundColor: template.defaultTheme?.primaryColor }}
        />
      );
    }

    return (
      <Avatar
        icon={<GlobalOutlined />}
        size={48}
        style={{
          backgroundColor: template.defaultTheme?.primaryColor || '#1890ff',
        }}
      />
    );
  };

  /**
   * Get category color
   */
  const getCategoryColor = (category: ServiceCategory): string => {
    const colors: Record<ServiceCategory, string> = {
      [ServiceCategory.EMAIL]: 'blue',
      [ServiceCategory.PRODUCTIVITY]: 'green',
      [ServiceCategory.COMMUNICATION]: 'purple',
      [ServiceCategory.DEVELOPMENT]: 'orange',
      [ServiceCategory.SOCIAL]: 'pink',
      [ServiceCategory.ENTERTAINMENT]: 'red',
      [ServiceCategory.FINANCE]: 'gold',
      [ServiceCategory.SHOPPING]: 'cyan',
      [ServiceCategory.NEWS]: 'lime',
      [ServiceCategory.EDUCATION]: 'volcano',
      [ServiceCategory.STORAGE]: 'geekblue',
      [ServiceCategory.DESIGN]: 'magenta',
      [ServiceCategory.MONITORING]: 'yellow',
      [ServiceCategory.OTHER]: 'default',
    };
    return colors[category] || 'default';
  };

  /**
   * Render template card
   */
  const renderTemplateCard = (template: ServiceTemplate) => (
    <Col xs={24} sm={12} md={8} lg={6} xl={4} key={template.id}>
      <Card
        hoverable
        onClick={() => handleTemplateSelect(template)}
        style={{
          height: '100%',
          border: selectedTemplateId === template.id ? '2px solid #1890ff' : undefined,
          cursor: 'pointer',
        }}
        bodyStyle={{ padding: '16px' }}
        cover={
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            }}
          >
            {getTemplateIcon(template)}
          </div>
        }
      >
        <Meta
          title={
            <Tooltip title={template.name}>
              <Text
                strong
                style={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {template.name}
              </Text>
            </Tooltip>
          }
          description={
            <Space direction='vertical' size={8} style={{ width: '100%' }}>
              <Text
                type='secondary'
                style={{
                  fontSize: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '16px',
                  height: '32px',
                }}
              >
                {template.description}
              </Text>

              <Space wrap size={4}>
                <Tag color={getCategoryColor(template.category)} style={{ fontSize: '10px' }}>
                  {template.category}
                </Tag>

                {template.supportedFeatures.includes(TemplateFeature.NOTIFICATIONS) && (
                  <Tag color='blue' style={{ fontSize: '10px' }}>
                    🔔
                  </Tag>
                )}

                {template.supportedFeatures.includes(TemplateFeature.AD_BLOCKING) && (
                  <Tag color='green' style={{ fontSize: '10px' }}>
                    🛡️
                  </Tag>
                )}

                {template.supportedFeatures.includes(TemplateFeature.CUSTOM_THEMING) && (
                  <Tag color='purple' style={{ fontSize: '10px' }}>
                    🎨
                  </Tag>
                )}
              </Space>

              <Text
                type='secondary'
                style={{
                  fontSize: '10px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {template.url}
              </Text>
            </Space>
          }
        />
      </Card>
    </Col>
  );

  /**
   * Render filters
   */
  const renderFilters = () => (
    <Space direction='vertical' size={16} style={{ width: '100%', marginBottom: 24 }}>
      <Row gutter={[16, 16]} align='middle'>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder='Search templates...'
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder='Category'
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={getCategoryOptions()}
            style={{ width: '100%' }}
          />
        </Col>

        <Col xs={24} sm={24} md={10}>
          <Select
            mode='multiple'
            placeholder='Filter by features'
            value={selectedFeatures}
            onChange={setSelectedFeatures}
            options={getFeatureOptions()}
            style={{ width: '100%' }}
            maxTagCount={2}
            suffixIcon={<FilterOutlined />}
          />
        </Col>
      </Row>

      <Row justify='space-between' align='middle'>
        <Col>
          <Text type='secondary'>
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          </Text>
        </Col>
        <Col>
          {(searchTerm || selectedCategory !== 'all' || selectedFeatures.length > 0) && (
            <Button
              type='link'
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedFeatures([]);
              }}
              style={{ padding: 0 }}
            >
              Clear filters
            </Button>
          )}
        </Col>
      </Row>
    </Space>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <Col span={24}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Space direction='vertical' align='center'>
            <Title level={4} type='secondary'>
              No Templates Found
            </Title>
            <Text type='secondary'>
              {searchTerm || selectedCategory !== 'all' || selectedFeatures.length > 0
                ? 'Try adjusting your search filters'
                : 'No service templates are available'}
            </Text>
          </Space>
        }
      >
        {(searchTerm || selectedCategory !== 'all' || selectedFeatures.length > 0) && (
          <Button
            type='primary'
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedFeatures([]);
            }}
          >
            Clear Filters
          </Button>
        )}
      </Empty>
    </Col>
  );

  return (
    <div className={className} style={style}>
      <Space direction='vertical' size={24} style={{ width: '100%' }}>
        <div>
          <Title level={3}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            Service Templates
          </Title>
          <Text type='secondary'>
            Choose from popular services or create your own custom configuration
          </Text>
        </div>

        {renderFilters()}

        <Row gutter={[16, 16]}>
          {filteredTemplates.length === 0
            ? renderEmptyState()
            : filteredTemplates.map(renderTemplateCard)}
        </Row>
      </Space>
    </div>
  );
};

export default ServiceTemplateGrid;
