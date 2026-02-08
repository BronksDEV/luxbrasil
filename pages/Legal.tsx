
import React from 'react';
import { Container, Typography, Paper, Box, Divider } from '@mui/material';
import { PageRoute } from '../types';
import { COMPANY_INFO } from '../constants';
import { VerifiedUser } from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';

interface LegalProps {
  type: PageRoute.LEGAL_PRIVACY | PageRoute.LEGAL_TERMS | PageRoute.LEGAL_DATA;
}

const Legal: React.FC<LegalProps> = ({ type }) => {
  const { t } = useLanguage();

  const getContent = () => {
    
    switch(type) {
      case PageRoute.LEGAL_PRIVACY:
        return {
          title: t('legal_privacy'),
          text: `
A BRASILUX  LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 61.197.797/0001-53, respeita a sua privacidade e está comprometida com a proteção dos dados pessoais tratados por meio desta plataforma.

Os dados coletados são limitados ao mínimo necessário para o funcionamento do serviço, podendo incluir informações de identificação, contato e registros de uso. Não coletamos dados sensíveis sem base legal válida.

Todos os dados são armazenados em ambiente seguro, com medidas técnicas e administrativas adequadas para prevenir acessos não autorizados, vazamentos ou usos indevidos.

O tratamento de dados segue a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD). O titular pode, a qualquer momento, solicitar confirmação de tratamento, acesso, correção, anonimização ou exclusão de seus dados, conforme permitido por lei.

Solicitações devem ser encaminhadas para o e-mail: joycesjc300@gmail.com.
          `
        };
      case PageRoute.LEGAL_DATA:
        return {
          title: t('legal_data'),
          text: `
A BRASILUX  LTDA atua como controladora dos dados pessoais tratados nesta plataforma, sendo responsável por definir as finalidades e os meios do tratamento.

Os dados não são comercializados nem compartilhados com terceiros, exceto quando necessário para o cumprimento de obrigações legais, regulatórias ou mediante consentimento expresso do titular.

O usuário é responsável pela veracidade das informações fornecidas. A empresa não se responsabiliza por prejuízos decorrentes de informações falsas ou desatualizadas inseridas pelo próprio usuário.

Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, as medidas cabíveis serão adotadas, incluindo comunicação aos titulares e à Autoridade Nacional de Proteção de Dados (ANPD), quando aplicável.
          `
        };
      default:
        return {
          title: t('legal_terms'),
          text: `
Este site é operado por A BRASILUX LTDA, inscrita no CNPJ nº 61.197.797/0001-53, com sede no Brasil. Ao acessar ou utilizar esta plataforma, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.

O uso da plataforma é permitido apenas para fins lícitos. É vedado qualquer uso que viole a legislação brasileira, direitos de terceiros ou que comprometa a segurança e integridade do sistema.

Quando aplicável, promoções, sorteios ou mecanismos de distribuição de benefícios utilizam lógica automatizada e critérios objetivos definidos pelo sistema. Não há garantia de resultado, ganho ou vantagem individual.

A empresa pode, a qualquer momento, suspender ou encerrar o acesso de usuários que violem estes termos, sem aviso prévio, bem como atualizar este documento para refletir alterações legais ou operacionais.

O uso contínuo da plataforma após alterações implica concordância com os termos atualizados.

Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do consumidor, conforme previsto no Código de Defesa do Consumidor, quando aplicável.
          `
        };
    }
  };

  const content = getContent();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#050510', py: 8 }}>
        <Container maxWidth="md">
            <Paper sx={{ 
                p: { xs: 4, md: 8 }, 
                bgcolor: '#FFF', 
                color: '#1a1a1a', // Dark text on white paper for legal doc feel
                borderRadius: 2,
                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>{t('legal_doc_official')}</Typography>
                    <VerifiedUser sx={{ color: '#D4AF37' }} />
                </Box>
                
                <Typography variant="h3" gutterBottom sx={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#000' }}>
                    {content.title}
                </Typography>
                
                <Divider sx={{ my: 4, borderColor: '#D4AF37' }} />

                <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'serif', fontSize: '1.1rem' }}>
                    {content.text}
                </Typography>
                
                <Box sx={{ mt: 8, p: 3, bgcolor: '#f5f5f5', borderLeft: '4px solid #D4AF37' }}>
                    <Typography variant="subtitle2" fontWeight="bold">BRAILLUX ENTERTAINMENT LTDA</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">CNPJ: {COMPANY_INFO.cnpj}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{COMPANY_INFO.address}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{t('legal_updated', { date: new Date().toLocaleDateString() })}</Typography>
                </Box>
            </Paper>
        </Container>
    </Box>
  );
};

export default Legal;
